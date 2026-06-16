package com.cyp.prompt.expert_backend.dto.response;

import java.util.List;

import com.cyp.prompt.expert_backend.enums.EducationLevel;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Información del usuario para el flujo de onboarding. Incluye el indicador
 * {@code onboardingComplete}, que se <b>calcula</b> (no se persiste) a partir
 * del estado del perfil. Los campos de perfil pueden venir en {@code null}
 * mientras el onboarding no se haya completado.
 */
@Schema(description = "Información del usuario con el estado de su onboarding")
public record UserResponse(

        @Schema(description = "ID del usuario", example = "2")
        Long userId,

        @Schema(description = "Nombre del usuario", example = "Juan Perez")
        String name,

        @Schema(description = "Email del usuario", example = "juan@example.com")
        String email,

        @Schema(description = "Nivel de educación (null si no completó onboarding)", nullable = true)
        EducationLevel educationLevel,

        @Schema(description = "Año de cursada (solo estudiantes; null si no aplica)", example = "3", nullable = true)
        Integer studyYear,

        @Schema(description = "Trabaja en IT (null si no completó onboarding)", example = "true", nullable = true)
        Boolean worksInIT,

        @Schema(description = "Indica si el perfil está completo (calculado, no persistido)", example = "false")
        boolean onboardingComplete,

        @Schema(description = "Skills del usuario con sus niveles")
        List<SkillResponse> skills
) {}
