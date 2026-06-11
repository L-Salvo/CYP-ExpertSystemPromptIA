package com.cyp.prompt.expert_backend.controller;

import com.cyp.prompt.expert_backend.dto.response.SendMessageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "AI", description = "Envío de prompts enriquecidos al modelo de IA externo")
@RestController
@RequestMapping("/api/messages")
public class AIController {

    @Operation(
            summary = "Enviar prompt enriquecido a la IA",
            description = """
                    Envía el prompt enriquecido de un mensaje existente al modelo de IA configurado.
                    La respuesta se persiste en el mensaje y se devuelve al frontend.
                    Solo puede llamarse si el mensaje ya tiene enrichedPrompt (no null).
                    """
    )
    @ApiResponse(responseCode = "200", description = "Respuesta recibida y persistida correctamente",
            content = @Content(schema = @Schema(implementation = SendMessageResponse.class)))
    @ApiResponse(responseCode = "400", description = "El mensaje no tiene enrichedPrompt")
    @ApiResponse(responseCode = "404", description = "Mensaje no encontrado")
    @ApiResponse(responseCode = "409", description = "El mensaje ya tiene respuesta de IA — usar /retry")
    @ApiResponse(responseCode = "503", description = "Servicio de IA no disponible")
    @PostMapping("/{messageId}/send")
    public ResponseEntity<SendMessageResponse> sendMessage(
            @Parameter(description = "ID del mensaje a enviar", required = true)
            @PathVariable Long messageId
    ) {
        // TODO: implementar con AIService (recupera enrichedPrompt → llama IA → persiste aiResponse)
        SendMessageResponse mock = new SendMessageResponse(
                messageId,
                "Docker es una plataforma de contenedores que permite empaquetar aplicaciones junto con sus dependencias "
                        + "en unidades aisladas llamadas contenedores. [Mock response]"
        );
        return ResponseEntity.ok(mock);
    }

    @Operation(
            summary = "Reintentar generación de respuesta IA",
            description = """
                    Reintenta la generación de la respuesta de IA para un mensaje que ya fue enviado anteriormente.
                    Sobrescribe la respuesta anterior.
                    """
    )
    @ApiResponse(responseCode = "200", description = "Nueva respuesta generada y persistida correctamente",
            content = @Content(schema = @Schema(implementation = SendMessageResponse.class)))
    @ApiResponse(responseCode = "404", description = "Mensaje no encontrado")
    @ApiResponse(responseCode = "503", description = "Servicio de IA no disponible")
    @PostMapping("/{messageId}/retry")
    public ResponseEntity<SendMessageResponse> retryMessage(
            @Parameter(description = "ID del mensaje a reintentar", required = true)
            @PathVariable Long messageId
    ) {
        // TODO: implementar con AIService (mismo flujo que /send, pero sobrescribe aiResponse existente)
        SendMessageResponse mock = new SendMessageResponse(
                messageId,
                "Docker es una plataforma de contenedores... [Mock retry response]"
        );
        return ResponseEntity.ok(mock);
    }
}
