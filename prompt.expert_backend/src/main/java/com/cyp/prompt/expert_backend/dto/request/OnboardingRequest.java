package com.cyp.prompt.expert_backend.dto.request;

import java.util.List;

import com.cyp.prompt.expert_backend.enums.EducationLevel;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/**
 * Request para completar el onboarding del perfil de un usuario.
 * Reemplaza por completo las skills existentes del usuario por las indicadas.
 */
@Schema(description = "Request para completar el onboarding del perfil")
public record OnboardingRequest(

        @NotNull(message = "El nivel educativo es obligatorio")
        @Schema(description = "Nivel de educación del usuario", example = "UNIVERSITY_STUDENT")
        EducationLevel educationLevel,

        @Schema(description = "Año de cursada (solo aplica para estudiantes)", example = "3", nullable = true)
        Integer studyYear,

        @NotNull(message = "El campo worksInIT es obligatorio")
        @Schema(description = "Indica si el usuario trabaja en IT", example = "true")
        Boolean worksInIT,

        @NotEmpty(message = "Debe declarar al menos una skill")
        @Valid
        @Schema(description = "Skills del usuario con su nivel (reemplazan las existentes)")
        List<OnboardingSkillRequest> skills
) {}
