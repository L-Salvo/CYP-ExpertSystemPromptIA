package com.cyp.prompt.expert_backend.unit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cyp.prompt.expert_backend.client.PrologClient;
import com.cyp.prompt.expert_backend.client.prolog.PrologRequest;
import com.cyp.prompt.expert_backend.client.prolog.PrologResponse;
import com.cyp.prompt.expert_backend.dto.request.EnrichPromptRequest;
import com.cyp.prompt.expert_backend.dto.response.EnrichPromptResponse;
import com.cyp.prompt.expert_backend.entity.Chat;
import com.cyp.prompt.expert_backend.entity.Message;
import com.cyp.prompt.expert_backend.entity.Skill;
import com.cyp.prompt.expert_backend.entity.User;
import com.cyp.prompt.expert_backend.entity.UserSkill;
import com.cyp.prompt.expert_backend.enums.EducationLevel;
import com.cyp.prompt.expert_backend.enums.SkillCategory;
import com.cyp.prompt.expert_backend.exception.ExternalServiceException;
import com.cyp.prompt.expert_backend.exception.ResourceNotFoundException;
import com.cyp.prompt.expert_backend.repository.ChatRepository;
import com.cyp.prompt.expert_backend.repository.MessageRepository;
import com.cyp.prompt.expert_backend.repository.UserSkillRepository;
import com.cyp.prompt.expert_backend.service.ExpertSystemService;
import com.cyp.prompt.expert_backend.service.PromptBuilder;

/**
 * Tests unitarios de {@link ExpertSystemService}, el orquestador del caso de uso
 * principal (enriquecimiento). Se verifican: construcción del {@link PrologRequest}
 * a partir del perfil, invocación del {@link PrologClient}, generación del
 * enrichedPrompt vía {@link PromptBuilder} y persistencia correcta del {@link Message}.
 */
@ExtendWith(MockitoExtension.class)
class ExpertSystemServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long CHAT_ID = 50L;
    private static final String PROMPT = "Explicame Docker";

    @Mock
    private ChatRepository chatRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private UserSkillRepository userSkillRepository;
    @Mock
    private PrologClient prologClient;
    @Mock
    private PromptBuilder promptBuilder;

    @InjectMocks
    private ExpertSystemService expertSystemService;

    private User user;
    private Chat chat;
    private UserSkill javaSkill;
    private PrologResponse prologResponse;
    private EnrichPromptRequest request;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(USER_ID).name("Lautaro").email("lau@test.com")
                .educationLevel(EducationLevel.UNIVERSITY_STUDENT)
                .studyYear(3).worksInIT(true)
                .build();
        chat = Chat.builder().id(CHAT_ID).user(user).title("Docker").build();
        Skill java = Skill.builder().id(20L).name("Java").category(SkillCategory.PROGRAMMING_LANGUAGE).build();
        javaSkill = UserSkill.builder().id(7L).user(user).skill(java).level(8).build();
        prologResponse = new PrologResponse(
                List.of("needs_docker", "advanced_java"),
                List.of("Usar ejemplos prácticos"),
                "Contexto: estudiante universitario");
        request = new EnrichPromptRequest(PROMPT);
    }

    /** Configura el camino feliz completo. Todas las stubs se ejercitan en cada test. */
    private void stubHappyPath() {
        // El usuario se deriva del chat (chat.getUser()); no se consulta por userId.
        given(chatRepository.findById(CHAT_ID)).willReturn(Optional.of(chat));
        given(userSkillRepository.findByUserId(USER_ID)).willReturn(List.of(javaSkill));
        given(prologClient.infer(any(PrologRequest.class))).willReturn(prologResponse);
        given(promptBuilder.buildEnrichedPrompt(eq(PROMPT), eq(prologResponse))).willReturn("ENRICHED");
        given(messageRepository.save(any(Message.class))).willAnswer(inv -> {
            Message msg = inv.getArgument(0);
            msg.setId(999L); // simula el id asignado por la persistencia
            return msg;
        });
    }

    @Test
    @DisplayName("construye el PrologRequest a partir del perfil e invoca al PrologClient")
    void enrichPrompt_buildsPrologRequestAndCallsClient() {
        stubHappyPath();

        expertSystemService.enrichPrompt(CHAT_ID, request);

        ArgumentCaptor<PrologRequest> captor = ArgumentCaptor.forClass(PrologRequest.class);
        verify(prologClient).infer(captor.capture());
        PrologRequest sent = captor.getValue();
        assertThat(sent.prompt()).isEqualTo(PROMPT);
        assertThat(sent.userProfile().educationLevel()).isEqualTo("UNIVERSITY_STUDENT");
        assertThat(sent.userProfile().studyYear()).isEqualTo(3);
        assertThat(sent.userProfile().worksInIT()).isTrue();
        assertThat(sent.userProfile().skills()).hasSize(1);
        assertThat(sent.userProfile().skills().get(0).name()).isEqualTo("Java");
        assertThat(sent.userProfile().skills().get(0).level()).isEqualTo(8);
    }

    @Test
    @DisplayName("genera el enrichedPrompt usando PromptBuilder con la respuesta de Prolog")
    void enrichPrompt_usesPromptBuilder() {
        stubHappyPath();

        EnrichPromptResponse response = expertSystemService.enrichPrompt(CHAT_ID, request);

        verify(promptBuilder).buildEnrichedPrompt(PROMPT, prologResponse);
        assertThat(response.enrichedPrompt()).isEqualTo("ENRICHED");
    }

    @Test
    @DisplayName("persiste el Message con prompt, inferencias y aiResponse=null")
    void enrichPrompt_persistsMessage() {
        stubHappyPath();

        EnrichPromptResponse response = expertSystemService.enrichPrompt(CHAT_ID, request);

        ArgumentCaptor<Message> captor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(captor.capture());
        Message saved = captor.getValue();
        assertThat(saved.getChat()).isSameAs(chat);
        assertThat(saved.getOriginalPrompt()).isEqualTo(PROMPT);
        assertThat(saved.getEnrichedPrompt()).isEqualTo("ENRICHED");
        assertThat(saved.getAppliedInferences()).containsExactly("needs_docker", "advanced_java");
        assertThat(saved.getAiResponse()).isNull();

        // La respuesta refleja el mensaje persistido.
        assertThat(response.messageId()).isEqualTo(999L);
        assertThat(response.chatId()).isEqualTo(CHAT_ID);
        assertThat(response.originalPrompt()).isEqualTo(PROMPT);
        assertThat(response.appliedInferences()).containsExactly("needs_docker", "advanced_java");
        assertThat(response.aiResponse()).isNull();
    }

    @Test
    @DisplayName("lanza 404 si el chat no existe y no toca Prolog")
    void enrichPrompt_chatNotFound_throws() {
        given(chatRepository.findById(CHAT_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> expertSystemService.enrichPrompt(CHAT_ID, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(String.valueOf(CHAT_ID));

        verifyNoInteractions(prologClient, promptBuilder);
        verify(messageRepository, never()).save(any());
    }

    @Test
    @DisplayName("propaga ExternalServiceException si Prolog no está disponible y no persiste")
    void enrichPrompt_prologUnavailable_propagates() {
        // El usuario se deriva del chat; solo se consultan chat y skills antes de Prolog.
        given(chatRepository.findById(CHAT_ID)).willReturn(Optional.of(chat));
        given(userSkillRepository.findByUserId(USER_ID)).willReturn(List.of(javaSkill));
        given(prologClient.infer(any(PrologRequest.class)))
                .willThrow(new ExternalServiceException("Prolog caído"));

        assertThatThrownBy(() -> expertSystemService.enrichPrompt(CHAT_ID, request))
                .isInstanceOf(ExternalServiceException.class);

        verifyNoInteractions(promptBuilder);
        verify(messageRepository, never()).save(any());
    }
}
