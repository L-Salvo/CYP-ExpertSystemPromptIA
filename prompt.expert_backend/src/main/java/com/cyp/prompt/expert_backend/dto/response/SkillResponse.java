package com.cyp.prompt.expert_backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Skill asociada al perfil de un usuario, con su nivel de conocimiento.
 * Usada en ProfileResponse.
 */
@Schema(description = "Skill del usuario con su nivel de conocimiento")
public record SkillResponse(

        @Schema(description = "ID de la skill", example = "3")
        Long skillId,

        @Schema(description = "Nombre de la skill", example = "Docker")
        String name,

        @Schema(description = "Nivel de conocimiento (1–10)", example = "2")
        Integer level
) {}
