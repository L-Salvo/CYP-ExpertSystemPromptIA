package com.cyp.prompt.expert_backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request de registro con credenciales (demo académica).
 * La password se guarda en texto plano: ver documentación de auth demo.
 */
@Schema(description = "Request para registrar un usuario con credenciales (demo)")
public record (

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 255, message = "El nombre no puede superar los 255 caracteres")
        @Schema(description = "Nombre del usuario", example = "Pedro")
        String name,

        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no tiene un formato válido")
        @Size(max = 255, message = "El email no puede superar los 255 caracteres")
        @Schema(description = "Email del usuario (único)", example = "pedro@test.com")
        String email,

        @NotBlank(message = "La password es obligatoria")
        @Size(max = 255, message = "La password no puede superar los 255 caracteres")
        @Schema(description = "Password en texto plano (demo, sin hashing)", example = "1234")
        String password
) {}
