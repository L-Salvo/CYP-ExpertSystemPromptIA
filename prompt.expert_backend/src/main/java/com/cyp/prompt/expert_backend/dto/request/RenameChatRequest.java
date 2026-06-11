package com.cyp.prompt.expert_backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request para renombrar un chat existente")
public record RenameChatRequest(

        @NotBlank(message = "El título no puede estar vacío")
        @Size(max = 255, message = "El título no puede superar los 255 caracteres")
        @Schema(description = "Nuevo título del chat", example = "Docker para backend developers")
        String title
) {}
