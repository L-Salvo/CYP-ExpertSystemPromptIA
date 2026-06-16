package com.cyp.prompt.expert_backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Respuesta del registro de un usuario nuevo (datos mínimos confirmados).
 */
@Schema(description = "Datos del usuario recién registrado")
public record CreateUserResponse(

        @Schema(description = "ID del usuario", example = "2")
        Long userId,

        @Schema(description = "Nombre del usuario", example = "Juan Perez")
        String name,

        @Schema(description = "Email del usuario", example = "juan@example.com")
        String email
) {}
