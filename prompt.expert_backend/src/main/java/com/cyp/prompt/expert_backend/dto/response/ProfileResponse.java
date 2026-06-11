package com.cyp.prompt.expert_backend.dto.response;

import com.cyp.prompt.expert_backend.enums.EducationLevel;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(description = "Perfil completo del usuario con skills y nivel de conocimiento")
public record ProfileResponse(

        @Schema(description = "ID del usuario", example = "1")
        Long userId,

        @Schema(description = "Nombre del usuario", example = "Lautaro")
        String name,

        @Schema(description = "Email del usuario", example = "lautaro@example.com")
        String email,

        @Schema(description = "Nivel de educación del usuario")
        EducationLevel educationLevel,

        @Schema(description = "Año de cursada (solo aplica para estudiantes)", example = "3", nullable = true)
        Integer studyYear,

        @Schema(description = "Indica si el usuario trabaja en IT", example = "true")
        Boolean worksInIT,

        @Schema(description = "Lista de skills del usuario con sus niveles")
        List<SkillResponse> skills,

        @Schema(description = "Fecha de creación del perfil", example = "2026-01-15T10:00:00Z")
        Instant createdAt
) {}
