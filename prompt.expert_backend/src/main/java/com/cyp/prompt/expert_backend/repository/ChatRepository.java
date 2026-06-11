package com.cyp.prompt.expert_backend.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cyp.prompt.expert_backend.entity.Chat;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {

    List<Chat> findByUserId(Long userId, Sort sort);

    Optional<Chat> findByIdAndUserId(Long id, Long userId);

    /**
     * Lista los chats del usuario junto al conteo de mensajes de cada uno.
     * Se expone como projection de Spring Data para evitar el mapeo manual de Object[].
     */
    @Query("""
            SELECT c.id          AS chatId,
                   c.title       AS title,
                   COUNT(m)      AS messageCount,
                   c.createdAt   AS createdAt,
                   c.updatedAt   AS updatedAt
            FROM Chat c
            LEFT JOIN c.messages m
            WHERE c.user.id = :userId
            GROUP BY c.id, c.title, c.createdAt, c.updatedAt
            ORDER BY c.updatedAt DESC
            """)
    List<ChatSummaryProjection> findChatsWithMessageCount(@Param("userId") Long userId);

    /**
     * Projection de solo lectura para el listado de chats con su conteo de mensajes.
     */
    interface ChatSummaryProjection {
        Long getChatId();

        String getTitle();

        Long getMessageCount();

        Instant getCreatedAt();

        Instant getUpdatedAt();
    }
}
