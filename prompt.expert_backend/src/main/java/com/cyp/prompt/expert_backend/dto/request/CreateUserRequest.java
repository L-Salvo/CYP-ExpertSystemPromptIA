package com.cyp.prompt.expert_backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para registrar un usuario nuevo (alta inicial, sin perfil).
 * El perfil se completa después con {@code PUT /api/users/{id}/onboarding}.
 */
@Schema(description = "Request para registrar un usuario nuevo")
public record CreateUserRequest(

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 255, message = "El nombre no puede superar los 255 caracteres")
        @Schema(description = "Nombre del usuario", example = "Juan Perez")
        String name,

        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no tiene un formato válido")
        @Size(max = 255, message = "El email no puede superar los 255 caracteres")
        @Schema(description = "Email del usuario (único)", example = "juan@example.com")
        String email
) {}
