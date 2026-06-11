package com.cyp.prompt.expert_backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request para enriquecer un prompt mediante el sistema experto")
public record EnrichPromptRequest(

        @NotBlank(message = "El prompt no puede estar vacío")
        @Size(max = 4000, message = "El prompt no puede superar los 4000 caracteres")
        @Schema(description = "Prompt original del usuario", example = "Explícame Docker")
        String prompt
) {}
