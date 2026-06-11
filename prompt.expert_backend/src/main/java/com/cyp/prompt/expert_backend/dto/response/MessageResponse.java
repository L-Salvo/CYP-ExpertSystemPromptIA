package com.cyp.prompt.expert_backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(description = "Mensaje dentro de un chat, con prompt original, enriquecido y respuesta de IA")
public record MessageResponse(

        @Schema(description = "ID del mensaje", example = "15")
        Long messageId,

        @Schema(description = "ID del chat al que pertenece", example = "12")
        Long chatId,

        @Schema(description = "Prompt original escrito por el usuario", example = "Explícame Docker")
        String originalPrompt,

        @Schema(description = "Lista de inferencias aplicadas por el sistema experto")
        List<String> appliedInferences,

        @Schema(description = "Prompt enriquecido generado por el sistema experto")
        String enrichedPrompt,

        @Schema(description = "Respuesta generada por el modelo de IA (null si aún no se envió)", nullable = true)
        String aiResponse,

        @Schema(description = "Fecha de creación del mensaje", example = "2026-06-10T14:05:00Z")
        Instant createdAt
) {}
