package com.cyp.prompt.expert_backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(description = "Respuesta del sistema experto tras enriquecer un prompt")
public record EnrichPromptResponse(

        @Schema(description = "ID del mensaje generado", example = "15")
        Long messageId,

        @Schema(description = "ID del chat al que pertenece el mensaje", example = "12")
        Long chatId,

        @Schema(description = "Prompt original enviado por el usuario", example = "Explícame Docker")
        String originalPrompt,

        @Schema(description = "Inferencias aplicadas por el sistema experto Prolog")
        List<String> appliedInferences,

        @Schema(description = "Prompt enriquecido con contexto del perfil del usuario")
        String enrichedPrompt,

        @Schema(description = "Respuesta de IA (siempre null en esta etapa)", nullable = true)
        String aiResponse,

        @Schema(description = "Fecha de creación del mensaje", example = "2026-06-10T14:05:00Z")
        Instant createdAt
) {}
