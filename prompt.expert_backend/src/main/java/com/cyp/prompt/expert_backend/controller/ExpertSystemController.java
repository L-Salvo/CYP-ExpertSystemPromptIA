package com.cyp.prompt.expert_backend.controller;

import com.cyp.prompt.expert_backend.dto.request.EnrichPromptRequest;
import com.cyp.prompt.expert_backend.dto.response.EnrichPromptResponse;
import com.cyp.prompt.expert_backend.service.ExpertSystemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Expert System", description = "Sistema experto de enriquecimiento de prompts mediante SWI-Prolog")
@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ExpertSystemController {

    // Sustituir por SecurityContext cuando se implemente autenticación
    private static final Long FIXED_USER_ID = 1L;

    private final ExpertSystemService expertSystemService;

    @Operation(
            summary = "Enriquecer prompt",
            description = """
                    Caso de uso principal del sistema.
                    Recibe el prompt original del usuario, consulta su perfil en PostgreSQL,
                    ejecuta las inferencias en Prolog y devuelve el prompt enriquecido junto
                    con las inferencias aplicadas. No consulta ningún modelo de IA en esta etapa.
                    El mensaje se persiste con aiResponse: null.
                    """
    )
    @ApiResponse(responseCode = "201", description = "Prompt enriquecido generado y mensaje persistido",
            content = @Content(schema = @Schema(implementation = EnrichPromptResponse.class)))
    @ApiResponse(responseCode = "400", description = "Prompt vacío o request inválido")
    @ApiResponse(responseCode = "404", description = "Chat no encontrado")
    @ApiResponse(responseCode = "503", description = "Servicio Prolog no disponible")
    @PostMapping("/{chatId}/messages/enrich")
    public ResponseEntity<EnrichPromptResponse> enrichPrompt(
            @Parameter(description = "ID del chat al que pertenecerá el mensaje", required = true)
            @PathVariable Long chatId,
            @Valid @RequestBody EnrichPromptRequest request
    ) {
        EnrichPromptResponse response = expertSystemService.enrichPrompt(FIXED_USER_ID, chatId, request);
        return ResponseEntity.status(201).body(response);
    }
}
