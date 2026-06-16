package com.cyp.prompt.expert_backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Respuesta del registro: id del usuario y estado (calculado) de su onboarding.
 */
@Schema(description = "Resultado del registro de un usuario")
public record RegisterUserResponse(

        @Schema(description = "ID del usuario", example = "5")
        Long userId,

        @Schema(description = "Indica si el perfil está completo (calculado). Tras registrarse es false.",
                example = "false")
        boolean onboardingComplete
) {}
