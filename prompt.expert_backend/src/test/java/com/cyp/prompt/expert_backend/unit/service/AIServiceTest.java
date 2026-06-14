package com.cyp.prompt.expert_backend.unit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cyp.prompt.expert_backend.client.AIClient;
import com.cyp.prompt.expert_backend.dto.response.SendMessageResponse;
import com.cyp.prompt.expert_backend.entity.Message;
import com.cyp.prompt.expert_backend.exception.ConflictException;
import com.cyp.prompt.expert_backend.exception.ResourceNotFoundException;
import com.cyp.prompt.expert_backend.repository.MessageRepository;
import com.cyp.prompt.expert_backend.service.AIService;

/**
 * Tests unitarios de {@link AIService}. Verifican el envío a la IA, el conflicto
 * 409 cuando ya existe respuesta, la regeneración (retry) y los ownership checks.
 */
@ExtendWith(MockitoExtension.class)
class AIServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long MESSAGE_ID = 7L;
    private static final String ENRICHED = "ENRICHED PROMPT";

    @Mock
    private MessageRepository messageRepository;
    @Mock
    private AIClient aiClient;

    @InjectMocks
    private AIService aiService;

    private Message message(String aiResponse) {
        return Message.builder()
                .id(MESSAGE_ID)
                .originalPrompt("Explicame Docker")
                .enrichedPrompt(ENRICHED)
                .appliedInferences(List.of("needs_docker"))
                .aiResponse(aiResponse)
                .build();
    }

    @Test
    @DisplayName("sendMessage genera la respuesta de IA y la persiste")
    void sendMessage_generatesAndPersists() {
        Message msg = message(null);
        given(messageRepository.findByIdAndChatUserId(MESSAGE_ID, USER_ID)).willReturn(Optional.of(msg));
        given(aiClient.generate(ENRICHED)).willReturn("AI RESPONSE");
        given(messageRepository.save(any(Message.class))).willAnswer(inv -> inv.getArgument(0));

        SendMessageResponse response = aiService.sendMessage(USER_ID, MESSAGE_ID);

        assertThat(msg.getAiResponse()).isEqualTo("AI RESPONSE");
        assertThat(response.messageId()).isEqualTo(MESSAGE_ID);
        assertThat(response.response()).isEqualTo("AI RESPONSE");
        verify(aiClient).generate(ENRICHED);
        verify(messageRepository).save(msg);
    }

    @Test
    @DisplayName("sendMessage lanza ConflictException (409) si ya existe aiResponse")
    void sendMessage_alreadyAnswered_conflict() {
        Message msg = message("Respuesta previa");
        given(messageRepository.findByIdAndChatUserId(MESSAGE_ID, USER_ID)).willReturn(Optional.of(msg));

        assertThatThrownBy(() -> aiService.sendMessage(USER_ID, MESSAGE_ID))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining(String.valueOf(MESSAGE_ID));

        verify(aiClient, never()).generate(any());
        verify(messageRepository, never()).save(any());
    }

    @Test
    @DisplayName("sendMessage lanza IllegalArgumentException si el mensaje no fue enriquecido")
    void sendMessage_notEnriched_throws() {
        Message msg = Message.builder().id(MESSAGE_ID).enrichedPrompt(null).aiResponse(null).build();
        given(messageRepository.findByIdAndChatUserId(MESSAGE_ID, USER_ID)).willReturn(Optional.of(msg));

        assertThatThrownBy(() -> aiService.sendMessage(USER_ID, MESSAGE_ID))
                .isInstanceOf(IllegalArgumentException.class);

        verify(aiClient, never()).generate(any());
        verify(messageRepository, never()).save(any());
    }

    @Test
    @DisplayName("retryMessage regenera y sobrescribe la respuesta existente")
    void retryMessage_regenerates() {
        Message msg = message("Respuesta vieja");
        given(messageRepository.findByIdAndChatUserId(MESSAGE_ID, USER_ID)).willReturn(Optional.of(msg));
        given(aiClient.generate(ENRICHED)).willReturn("Respuesta nueva");
        given(messageRepository.save(any(Message.class))).willAnswer(inv -> inv.getArgument(0));

        SendMessageResponse response = aiService.retryMessage(USER_ID, MESSAGE_ID);

        assertThat(msg.getAiResponse()).isEqualTo("Respuesta nueva");
        assertThat(response.messageId()).isEqualTo(MESSAGE_ID);
        assertThat(response.response()).isEqualTo("Respuesta nueva");
        verify(aiClient).generate(ENRICHED);
    }

    @Test
    @DisplayName("ownership: sendMessage lanza 404 si el mensaje no pertenece al usuario")
    void sendMessage_notOwned_throws() {
        given(messageRepository.findByIdAndChatUserId(MESSAGE_ID, USER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> aiService.sendMessage(USER_ID, MESSAGE_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(String.valueOf(MESSAGE_ID));

        verify(aiClient, never()).generate(any());
    }

    @Test
    @DisplayName("ownership: retryMessage lanza 404 si el mensaje no pertenece al usuario")
    void retryMessage_notOwned_throws() {
        given(messageRepository.findByIdAndChatUserId(MESSAGE_ID, USER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> aiService.retryMessage(USER_ID, MESSAGE_ID))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(aiClient, never()).generate(any());
    }
}
