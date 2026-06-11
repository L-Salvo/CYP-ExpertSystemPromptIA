package com.cyp.prompt.expert_backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Resumen de un chat (sin mensajes)")
public record ChatResponse(

        @Schema(description = "ID del chat", example = "12")
        Long chatId,

        @Schema(description = "Título del chat", example = "Aprendiendo Docker")
        String title,

        @Schema(description = "Cantidad de mensajes en el chat", example = "4")
        Integer messageCount,

        @Schema(description = "Fecha de creación", example = "2026-06-10T14:00:00Z")
        Instant createdAt,

        @Schema(description = "Fecha de última actualización", example = "2026-06-10T15:30:00Z")
        Instant updatedAt
) {}
