package com.cyp.prompt.expert_backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Respuesta del login (demo). No incluye token ni sesión: el frontend solo
 * almacena el {@code userId} y lo reenvía en el header {@code X-User-Id}.
 */
@Schema(description = "Resultado del login de un usuario")
public record LoginResponse(

        @Schema(description = "ID del usuario", example = "5")
        Long userId,

        @Schema(description = "Nombre del usuario", example = "Pedro")
        String name,

        @Schema(description = "Email del usuario", example = "pedro@test.com")
        String email,

        @Schema(description = "Indica si el perfil está completo (calculado)", example = "true")
        boolean onboardingComplete
) {}
