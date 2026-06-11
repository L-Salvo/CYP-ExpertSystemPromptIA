package com.cyp.prompt.expert_backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request para crear un nuevo chat")
public record CreateChatRequest(

        @NotBlank(message = "El título no puede estar vacío")
        @Size(max = 255, message = "El título no puede superar los 255 caracteres")
        @Schema(description = "Título del chat", example = "Aprendiendo Docker")
        String title
) {}
