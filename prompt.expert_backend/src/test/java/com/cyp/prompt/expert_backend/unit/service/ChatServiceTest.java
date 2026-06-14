package com.cyp.prompt.expert_backend.unit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cyp.prompt.expert_backend.dto.request.CreateChatRequest;
import com.cyp.prompt.expert_backend.dto.request.RenameChatRequest;
import com.cyp.prompt.expert_backend.dto.response.ChatDetailResponse;
import com.cyp.prompt.expert_backend.dto.response.ChatResponse;
import com.cyp.prompt.expert_backend.dto.response.RenameChatResponse;
import com.cyp.prompt.expert_backend.entity.Chat;
import com.cyp.prompt.expert_backend.entity.Message;
import com.cyp.prompt.expert_backend.entity.User;
import com.cyp.prompt.expert_backend.exception.ResourceNotFoundException;
import com.cyp.prompt.expert_backend.repository.ChatRepository;
import com.cyp.prompt.expert_backend.repository.ChatRepository.ChatSummaryProjection;
import com.cyp.prompt.expert_backend.repository.MessageRepository;
import com.cyp.prompt.expert_backend.repository.UserRepository;
import com.cyp.prompt.expert_backend.service.ChatService;

/**
 * Tests unitarios de {@link ChatService}, incluyendo verificación de ownership
 * (un chat ajeno al usuario se trata como inexistente → 404).
 */
@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long CHAT_ID = 100L;

    @Mock
    private ChatRepository chatRepository;
    @Mock
    private MessageRepository messageRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ChatService chatService;

    private User user;
    private Instant now;

    @BeforeEach
    void setUp() {
        now = Instant.parse("2024-01-01T00:00:00Z");
        user = User.builder().id(USER_ID).name("Lautaro").email("lau@test.com").build();
    }

    @Test
    @DisplayName("createChat persiste el chat y devuelve messageCount=0")
    void createChat_creates() {
        given(userRepository.findById(USER_ID)).willReturn(Optional.of(user));
        Chat saved = Chat.builder().id(CHAT_ID).user(user).title("Docker")
                .createdAt(now).updatedAt(now).build();
        given(chatRepository.save(any(Chat.class))).willReturn(saved);

        ChatResponse response = chatService.createChat(USER_ID, new CreateChatRequest("Docker"));

        assertThat(response.chatId()).isEqualTo(CHAT_ID);
        assertThat(response.title()).isEqualTo("Docker");
        assertThat(response.messageCount()).isEqualTo(0);
        assertThat(response.createdAt()).isEqualTo(now);
    }

    @Test
    @DisplayName("createChat lanza ResourceNotFoundException si el usuario no existe")
    void createChat_userNotFound_throws() {
        given(userRepository.findById(USER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.createChat(USER_ID, new CreateChatRequest("Docker")))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(chatRepository, never()).save(any());
    }

    @Test
    @DisplayName("getChats mapea la projection incluyendo el conteo de mensajes")
    void getChats_returnsSummaries() {
        ChatSummaryProjection projection = mock(ChatSummaryProjection.class);
        given(projection.getChatId()).willReturn(CHAT_ID);
        given(projection.getTitle()).willReturn("Docker");
        given(projection.getMessageCount()).willReturn(3L);
        given(projection.getCreatedAt()).willReturn(now);
        given(projection.getUpdatedAt()).willReturn(now);
        given(chatRepository.findChatsWithMessageCount(USER_ID)).willReturn(List.of(projection));

        List<ChatResponse> result = chatService.getChats(USER_ID);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).chatId()).isEqualTo(CHAT_ID);
        assertThat(result.get(0).title()).isEqualTo("Docker");
        assertThat(result.get(0).messageCount()).isEqualTo(3);
    }

    @Test
    @DisplayName("getChatById devuelve el chat con sus mensajes mapeados")
    void getChatById_returnsDetail() {
        Chat chat = Chat.builder().id(CHAT_ID).user(user).title("Docker")
                .createdAt(now).updatedAt(now).build();
        Message message = Message.builder().id(7L).chat(chat)
                .originalPrompt("orig").enrichedPrompt("enr")
                .appliedInferences(List.of("inf1")).aiResponse("ai").createdAt(now).build();
        given(chatRepository.findByIdAndUserId(CHAT_ID, USER_ID)).willReturn(Optional.of(chat));
        given(messageRepository.findByChatIdOrderByCreatedAtAsc(CHAT_ID)).willReturn(List.of(message));

        ChatDetailResponse response = chatService.getChatById(USER_ID, CHAT_ID);

        assertThat(response.chatId()).isEqualTo(CHAT_ID);
        assertThat(response.title()).isEqualTo("Docker");
        assertThat(response.messages()).hasSize(1);
        assertThat(response.messages().get(0).messageId()).isEqualTo(7L);
        assertThat(response.messages().get(0).originalPrompt()).isEqualTo("orig");
        assertThat(response.messages().get(0).aiResponse()).isEqualTo("ai");
    }

    @Test
    @DisplayName("renameChat actualiza el título del chat")
    void renameChat_updatesTitle() {
        Chat chat = Chat.builder().id(CHAT_ID).user(user).title("Old")
                .createdAt(now).updatedAt(now).build();
        given(chatRepository.findByIdAndUserId(CHAT_ID, USER_ID)).willReturn(Optional.of(chat));
        given(chatRepository.save(any(Chat.class))).willAnswer(inv -> inv.getArgument(0));

        RenameChatResponse response = chatService.renameChat(USER_ID, CHAT_ID, new RenameChatRequest("New"));

        assertThat(chat.getTitle()).isEqualTo("New");
        assertThat(response.chatId()).isEqualTo(CHAT_ID);
        assertThat(response.title()).isEqualTo("New");
    }

    @Test
    @DisplayName("deleteChat elimina el chat encontrado")
    void deleteChat_deletes() {
        Chat chat = Chat.builder().id(CHAT_ID).user(user).title("Docker").build();
        given(chatRepository.findByIdAndUserId(CHAT_ID, USER_ID)).willReturn(Optional.of(chat));

        chatService.deleteChat(USER_ID, CHAT_ID);

        verify(chatRepository).delete(chat);
    }

    @Test
    @DisplayName("ownership: getChatById lanza 404 si el chat no pertenece al usuario")
    void getChatById_notOwned_throws() {
        given(chatRepository.findByIdAndUserId(CHAT_ID, USER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.getChatById(USER_ID, CHAT_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(String.valueOf(CHAT_ID));

        verifyNoInteractions(messageRepository);
    }

    @Test
    @DisplayName("ownership: renameChat lanza 404 si el chat no pertenece al usuario")
    void renameChat_notOwned_throws() {
        given(chatRepository.findByIdAndUserId(CHAT_ID, USER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.renameChat(USER_ID, CHAT_ID, new RenameChatRequest("New")))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(chatRepository, never()).save(any());
    }

    @Test
    @DisplayName("ownership: deleteChat lanza 404 si el chat no pertenece al usuario")
    void deleteChat_notOwned_throws() {
        given(chatRepository.findByIdAndUserId(CHAT_ID, USER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.deleteChat(USER_ID, CHAT_ID))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(chatRepository, never()).delete(any());
    }
}
