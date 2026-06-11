package com.cyp.prompt.expert_backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cyp.prompt.expert_backend.dto.request.CreateChatRequest;
import com.cyp.prompt.expert_backend.dto.request.RenameChatRequest;
import com.cyp.prompt.expert_backend.dto.response.ChatDetailResponse;
import com.cyp.prompt.expert_backend.dto.response.ChatResponse;
import com.cyp.prompt.expert_backend.dto.response.MessageResponse;
import com.cyp.prompt.expert_backend.dto.response.RenameChatResponse;
import com.cyp.prompt.expert_backend.entity.Chat;
import com.cyp.prompt.expert_backend.entity.Message;
import com.cyp.prompt.expert_backend.entity.User;
import com.cyp.prompt.expert_backend.exception.ResourceNotFoundException;
import com.cyp.prompt.expert_backend.repository.ChatRepository;
import com.cyp.prompt.expert_backend.repository.ChatRepository.ChatSummaryProjection;
import com.cyp.prompt.expert_backend.repository.MessageRepository;
import com.cyp.prompt.expert_backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChatResponse createChat(Long userId, CreateChatRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Chat chat = Chat.builder()
                .user(user)
                .title(request.title())
                .build();

        Chat saved = chatRepository.save(chat);
        return new ChatResponse(
                saved.getId(),
                saved.getTitle(),
                0,
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<ChatResponse> getChats(Long userId) {
        List<ChatSummaryProjection> projections = chatRepository.findChatsWithMessageCount(userId);
        return projections.stream()
                .map(ChatService::toChatResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ChatDetailResponse getChatById(Long userId, Long chatId) {
        Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found with id: " + chatId));

        List<Message> messages = messageRepository.findByChatIdOrderByCreatedAtAsc(chatId);
        List<MessageResponse> messageResponses = messages.stream()
                .map(ChatService::toMessageResponse)
                .toList();

        return new ChatDetailResponse(
                chat.getId(),
                chat.getTitle(),
                chat.getCreatedAt(),
                chat.getUpdatedAt(),
                messageResponses
        );
    }

    @Transactional
    public RenameChatResponse renameChat(Long userId, Long chatId, RenameChatRequest request) {
        Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found with id: " + chatId));

        chat.setTitle(request.title());
        Chat saved = chatRepository.save(chat);

        return new RenameChatResponse(saved.getId(), saved.getTitle(), saved.getUpdatedAt());
    }

    @Transactional
    public void deleteChat(Long userId, Long chatId) {
        Chat chat = chatRepository.findByIdAndUserId(chatId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found with id: " + chatId));
        chatRepository.delete(chat);
    }

    private static ChatResponse toChatResponse(ChatSummaryProjection projection) {
        Long count = projection.getMessageCount();
        return new ChatResponse(
                projection.getChatId(),
                projection.getTitle(),
                count == null ? 0 : count.intValue(),
                projection.getCreatedAt(),
                projection.getUpdatedAt()
        );
    }

    private static MessageResponse toMessageResponse(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getChat().getId(),
                message.getOriginalPrompt(),
                message.getAppliedInferences(),
                message.getEnrichedPrompt(),
                message.getAiResponse(),
                message.getCreatedAt()
        );
    }
}
