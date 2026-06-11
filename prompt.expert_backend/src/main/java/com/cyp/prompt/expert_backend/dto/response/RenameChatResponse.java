package com.cyp.prompt.expert_backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Respuesta al renombrar un chat")
public record RenameChatResponse(

        @Schema(description = "ID del chat", example = "12")
        Long chatId,

        @Schema(description = "Nuevo título del chat", example = "Docker para backend developers")
        String title,

        @Schema(description = "Fecha de última actualización", example = "2026-06-10T16:00:00Z")
        Instant updatedAt
) {}
