package com.cyp.prompt.expert_backend.controller;

import com.cyp.prompt.expert_backend.dto.request.EnrichPromptRequest;
import com.cyp.prompt.expert_backend.dto.response.EnrichPromptResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@Tag(name = "Expert System", description = "Sistema experto de enriquecimiento de prompts mediante SWI-Prolog")
@RestController
@RequestMapping("/api/chats")
public class ExpertSystemController {

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
        // TODO: implementar con ExpertSystemService (consulta perfil → invoca Prolog → construye prompt enriquecido)
        EnrichPromptResponse mock = new EnrichPromptResponse(
                15L,
                chatId,
                request.prompt(),
                List.of("backend_developer", "needs_docker", "use_java_examples"),
                "El usuario es estudiante universitario de tercer año que trabaja en IT y tiene nivel avanzado en Java (8/10) "
                        + "pero nivel inicial en Docker (2/10). " + request.prompt()
                        + " desde una perspectiva de backend Java.",
                null,
                Instant.now()
        );
        return ResponseEntity.status(201).body(mock);
    }
}
