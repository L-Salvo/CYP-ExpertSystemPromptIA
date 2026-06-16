package com.cyp.prompt.expert_backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request de login (demo académica): email + password en texto plano.
 */
@Schema(description = "Request de login (demo)")
public record LoginRequest(

        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no tiene un formato válido")
        @Schema(description = "Email del usuario", example = "pedro@test.com")
        String email,

        @NotBlank(message = "La password es obligatoria")
        @Schema(description = "Password en texto plano (demo)", example = "1234")
        String password
) {}
