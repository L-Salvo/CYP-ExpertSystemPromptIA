package com.cyp.prompt.expert_backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta de la IA para un mensaje enviado")
public record SendMessageResponse(

        @Schema(description = "ID del mensaje", example = "15")
        Long messageId,

        @Schema(description = "Respuesta generada por el modelo de IA")
        String response
) {}
