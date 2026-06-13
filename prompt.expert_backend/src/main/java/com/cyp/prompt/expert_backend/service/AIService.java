package com.cyp.prompt.expert_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cyp.prompt.expert_backend.client.AIClient;
import com.cyp.prompt.expert_backend.dto.response.SendMessageResponse;
import com.cyp.prompt.expert_backend.entity.Message;
import com.cyp.prompt.expert_backend.exception.ConflictException;
import com.cyp.prompt.expert_backend.exception.ResourceNotFoundException;
import com.cyp.prompt.expert_backend.repository.MessageRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Orquesta el envío del prompt enriquecido al modelo de IA y la persistencia
 * de la respuesta generada.
 *
 * <p>Es el complemento de {@link ExpertSystemService}: mientras aquél construye y
 * persiste el {@code enrichedPrompt} (con {@code aiResponse = null}), este servicio
 * toma ese mensaje ya enriquecido, invoca {@link AIClient} y guarda la respuesta.
 * El desacoplamiento entre ambos endpoints es deliberado (ADR-002, ADR-005).</p>
 *
 * <p>Diferencia entre las dos operaciones:</p>
 * <ul>
 *   <li>{@link #sendMessage} — sólo válido si {@code aiResponse} aún es {@code null};
 *       si ya existe respuesta lanza {@link ConflictException} (409).</li>
 *   <li>{@link #retryMessage} — reutiliza el {@code enrichedPrompt} y sobrescribe
 *       la respuesta existente sin importar su estado.</li>
 * </ul>
 *
 * <p>Cualquier fallo de {@link AIClient} se propaga como
 * {@link com.cyp.prompt.expert_backend.exception.ExternalServiceException} (503).</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AIService {

    private final MessageRepository messageRepository;
    private final AIClient aiClient;

    /**
     * Envía el prompt enriquecido de un mensaje al modelo de IA y persiste la respuesta.
     *
     * @param userId    dueño del chat al que pertenece el mensaje (ownership verificado)
     * @param messageId mensaje ya enriquecido a enviar
     * @return el {@code messageId} y la respuesta generada por la IA
     * @throws ResourceNotFoundException si el mensaje no existe o no pertenece al usuario
     * @throws ConflictException         si el mensaje ya tiene {@code aiResponse} (usar /retry)
     * @throws com.cyp.prompt.expert_backend.exception.ExternalServiceException
     *         si el servicio de IA no está disponible
     */
    @Transactional
    public SendMessageResponse sendMessage(Long userId, Long messageId) {
        Message message = findOwnedMessage(userId, messageId);

        // El mensaje debe estar enriquecido antes de poder enviarse a la IA.
        if (message.getEnrichedPrompt() == null) {
            throw new IllegalArgumentException(
                    "El mensaje " + messageId + " no tiene prompt enriquecido; primero debe enriquecerse.");
        }

        // /send sólo opera sobre mensajes sin respuesta previa.
        if (message.getAiResponse() != null) {
            throw new ConflictException(
                    "El mensaje " + messageId + " ya tiene respuesta de IA. Use /retry para regenerarla.");
        }

        String aiResponse = aiClient.generate(message.getEnrichedPrompt());
        message.setAiResponse(aiResponse);
        Message saved = messageRepository.save(message);

        log.debug("[AIService] Mensaje {} enviado a la IA; respuesta persistida ({} caracteres)",
                saved.getId(), aiResponse.length());

        return new SendMessageResponse(saved.getId(), saved.getAiResponse());
    }

    /**
     * Reintenta la generación de la respuesta de IA reutilizando el {@code enrichedPrompt}
     * existente y sobrescribiendo la respuesta anterior.
     *
     * @param userId    dueño del chat al que pertenece el mensaje (ownership verificado)
     * @param messageId mensaje cuya respuesta se regenerará
     * @return el {@code messageId} y la nueva respuesta generada por la IA
     * @throws ResourceNotFoundException si el mensaje no existe o no pertenece al usuario
     * @throws com.cyp.prompt.expert_backend.exception.ExternalServiceException
     *         si el servicio de IA no está disponible
     */
    @Transactional
    public SendMessageResponse retryMessage(Long userId, Long messageId) {
        Message message = findOwnedMessage(userId, messageId);

        if (message.getEnrichedPrompt() == null) {
            throw new IllegalArgumentException(
                    "El mensaje " + messageId + " no tiene prompt enriquecido; primero debe enriquecerse.");
        }

        String aiResponse = aiClient.generate(message.getEnrichedPrompt());
        message.setAiResponse(aiResponse);
        Message saved = messageRepository.save(message);

        log.debug("[AIService] Mensaje {} reintentado; respuesta sobrescrita ({} caracteres)",
                saved.getId(), aiResponse.length());

        return new SendMessageResponse(saved.getId(), saved.getAiResponse());
    }

    /**
     * Recupera el mensaje verificando que exista y pertenezca al usuario.
     * La validación de ownership se delega a la query
     * {@code findByIdAndChatUserId} del repositorio.
     */
    private Message findOwnedMessage(Long userId, Long messageId) {
        return messageRepository.findByIdAndChatUserId(messageId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));
    }
}
