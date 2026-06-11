package com.cyp.prompt.expert_backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request para actualizar el nivel de conocimiento de una skill")
public record UpdateSkillLevelRequest(

        @NotNull(message = "El nivel es obligatorio")
        @Min(value = 1, message = "El nivel mínimo es 1")
        @Max(value = 10, message = "El nivel máximo es 10")
        @Schema(description = "Nivel de conocimiento (1–10)", example = "5", minimum = "1", maximum = "10")
        Integer level
) {}
