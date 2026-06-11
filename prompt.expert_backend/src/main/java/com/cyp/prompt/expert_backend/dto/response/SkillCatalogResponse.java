package com.cyp.prompt.expert_backend.dto.response;

import com.cyp.prompt.expert_backend.enums.SkillCategory;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Skill del catálogo global del sistema, con su categoría.
 * Usada en GET /api/skills (sin nivel, ya que el nivel es relativo al usuario).
 */
@Schema(description = "Skill del catálogo del sistema")
public record SkillCatalogResponse(

        @Schema(description = "ID de la skill", example = "1")
        Long skillId,

        @Schema(description = "Nombre de la skill", example = "Java")
        String name,

        @Schema(description = "Categoría de la skill", example = "BACKEND")
        SkillCategory category
) {}
