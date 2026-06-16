package com.cyp.prompt.expert_backend.service;

import java.nio.charset.StandardCharsets;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cyp.prompt.expert_backend.client.PrologClient;
import com.cyp.prompt.expert_backend.client.prolog.PrologRequest;
import com.cyp.prompt.expert_backend.client.prolog.PrologResponse;
import com.cyp.prompt.expert_backend.client.prolog.PrologSkillEntry;
import com.cyp.prompt.expert_backend.client.prolog.PrologUserProfile;
import com.cyp.prompt.expert_backend.dto.request.EnrichPromptRequest;
import com.cyp.prompt.expert_backend.dto.response.EnrichPromptResponse;
import com.cyp.prompt.expert_backend.entity.Chat;
import com.cyp.prompt.expert_backend.entity.Message;
import com.cyp.prompt.expert_backend.entity.User;
import com.cyp.prompt.expert_backend.entity.UserSkill;
import com.cyp.prompt.expert_backend.exception.ResourceNotFoundException;
import com.cyp.prompt.expert_backend.repository.ChatRepository;
import com.cyp.prompt.expert_backend.repository.MessageRepository;
import com.cyp.prompt.expert_backend.repository.UserRepository;
import com.cyp.prompt.expert_backend.repository.UserSkillRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Orquesta el caso de uso principal del sistema: enriquecer un prompt.
 *
 * <p>Flujo:</p>
 * <ol>
 *   <li>Verifica ownership del chat ({@code chatId} + {@code userId}).</li>
 *   <li>Recupera el perfil real del usuario desde PostgreSQL.</li>
 *   <li>Construye el {@link PrologRequest} con ese perfil.</li>
 *   <li>Invoca {@link PrologClient} para obtener inferencias, recomendaciones y contexto.</li>
 *   <li>Construye el {@code enrichedPrompt} con {@link PromptBuilder}.</li>
 *   <li>Persiste el {@link Message} ({@code aiResponse = null}; aún no hay IA).</li>
 * </ol>
 *
 * <p>Las inferencias se persisten en {@code Message.appliedInferences} para auditoría,
 * debugging y analytics. El enriquecimiento del prompt lo decide {@link PromptBuilder}
 * a partir de {@code additionalContext} y {@code recommendations}, no de las inferencias.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExpertSystemService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final PrologClient prologClient;
    private final PromptBuilder promptBuilder;

    // ===== DIAGNÓSTICO TEMPORAL (remover tras depurar) =====
    private static final ObjectMapper DIAG_MAPPER = new ObjectMapper();

    /**
     * Enriquece el prompt original del usuario y persiste el mensaje resultante.
     *
     * @param userId  dueño del chat (ownership verificado contra {@code chatId})
     * @param chatId  chat al que pertenecerá el mensaje
     * @param request prompt original del usuario
     * @return los datos del mensaje persistido, con {@code aiResponse = null}
     * @throws ResourceNotFoundException si el chat no existe o no pertenece al usuario
     * @throws com.cyp.prompt.expert_backend.exception.ExternalServiceException
     *         si el servicio Prolog no está disponible
     */
    @Transactional
    public EnrichPromptResponse enrichPrompt(Long userId, Long chatId, EnrichPromptRequest request) {
        // 1. Ownership: el chat debe existir y pertenecer al usuario.
        Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found with id: " + chatId));

        // 2. Perfil real del usuario desde PostgreSQL.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        List<UserSkill> userSkills = userSkillRepository.findByUserId(userId);

        // 3. PrologRequest con datos reales (sin mocks de perfil).
        PrologRequest prologRequest = buildPrologRequest(request.prompt(), user, userSkills);

        // ===== DIAGNÓSTICO TEMPORAL (remover tras depurar) =====
        try {
            byte[] promptBytes = request.prompt().getBytes(StandardCharsets.UTF_8);
            log.warn("[DIAG] enrichPrompt → userId={}, chatId={}, prompt='{}', chars={}, utf8Bytes={}",
                    userId, chatId, request.prompt(), request.prompt().length(), promptBytes.length);
            log.warn("[DIAG] prompt (hex UTF-8) = {}", toHex(promptBytes));
            log.warn("[DIAG] PrologRequest serializado = {}", DIAG_MAPPER.writeValueAsString(prologRequest));
        } catch (Exception diagEx) {
            log.warn("[DIAG] Error en logging de diagnóstico: {}", diagEx.toString());
        }
        // ===== FIN DIAGNÓSTICO =====

        // 4. Inferencia: inferences + recommendations + additionalContext.
        PrologResponse prologResponse = prologClient.infer(prologRequest);

        // 5. Enriquecimiento: el PromptBuilder usa additionalContext + recommendations.
        String enrichedPrompt = promptBuilder.buildEnrichedPrompt(request.prompt(), prologResponse);

        // 6. Persistencia. Las inferencias se guardan para auditoría/analytics; aiResponse aún no existe.
        Message message = Message.builder()
                .chat(chat)
                .originalPrompt(request.prompt())
                .enrichedPrompt(enrichedPrompt)
                .appliedInferences(prologResponse.inferences())
                .aiResponse(null)
                .build();
        Message saved = messageRepository.save(message);

        log.debug("[ExpertSystem] Mensaje {} enriquecido en chat {} con {} inferencias",
                saved.getId(), chatId, saved.getAppliedInferences().size());

        return new EnrichPromptResponse(
                saved.getId(),
                chat.getId(),
                saved.getOriginalPrompt(),
                saved.getAppliedInferences(),
                saved.getEnrichedPrompt(),
                saved.getAiResponse(),
                saved.getCreatedAt()
        );
    }

    /**
     * Mapea el perfil persistido (entidades JPA) al contrato que espera Prolog.
     * Vive en este servicio por decisión arquitectónica: {@link PromptBuilder}
     * conserva su responsabilidad única de ensamblar texto.
     */
    private PrologRequest buildPrologRequest(String prompt, User user, List<UserSkill> userSkills) {
        List<PrologSkillEntry> skills = userSkills.stream()
                .map(us -> new PrologSkillEntry(us.getSkill().getName(), us.getLevel()))
                .toList();

        PrologUserProfile profile = new PrologUserProfile(
                user.getEducationLevel().name(),
                user.getStudyYear(),
                user.getWorksInIT(),
                skills
        );

        return new PrologRequest(prompt, profile);
    }

    // ===== DIAGNÓSTICO TEMPORAL =====
    private static String toHex(byte[] data) {
        StringBuilder sb = new StringBuilder();
        for (byte b : data) {
            sb.append(String.format("%02x ", b));
        }
        return sb.toString().trim();
    }
}
