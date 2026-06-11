package com.cyp.prompt.expert_backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(description = "Chat completo con todos sus mensajes")
public record ChatDetailResponse(

        @Schema(description = "ID del chat", example = "12")
        Long chatId,

        @Schema(description = "Título del chat", example = "Aprendiendo Docker")
        String title,

        @Schema(description = "Fecha de creación", example = "2026-06-10T14:00:00Z")
        Instant createdAt,

        @Schema(description = "Fecha de última actualización", example = "2026-06-10T15:30:00Z")
        Instant updatedAt,

        @Schema(description = "Lista de mensajes del chat ordenados cronológicamente")
        List<MessageResponse> messages
) {}
