package com.cyp.prompt.expert_backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Una skill declarada durante el onboarding: referencia a una skill del
 * catálogo ({@code skillId}) más el nivel de conocimiento del usuario.
 */
@Schema(description = "Skill declarada en el onboarding (referencia al catálogo + nivel)")
public record OnboardingSkillRequest(

        @NotNull(message = "El skillId es obligatorio")
        @Schema(description = "ID de la skill del catálogo", example = "1")
        Long skillId,

        @NotNull(message = "El nivel es obligatorio")
        @Min(value = 1, message = "El nivel mínimo es 1")
        @Max(value = 10, message = "El nivel máximo es 10")
        @Schema(description = "Nivel de conocimiento (1–10)", example = "8", minimum = "1", maximum = "10")
        Integer level
) {}
