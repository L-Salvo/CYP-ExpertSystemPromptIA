package com.cyp.prompt.expert_backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Estructura estándar de respuesta de error")
public record ErrorResponse(

        @Schema(description = "Código HTTP del error", example = "404")
        int status,

        @Schema(description = "Descripción del error HTTP", example = "Not Found")
        String error,

        @Schema(description = "Mensaje descriptivo del error", example = "Chat not found with id: 42")
        String message,

        @Schema(description = "Timestamp del error", example = "2026-06-10T14:30:00Z")
        Instant timestamp
) {}
