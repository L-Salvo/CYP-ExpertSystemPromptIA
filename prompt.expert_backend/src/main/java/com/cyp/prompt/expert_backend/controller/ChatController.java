package com.cyp.prompt.expert_backend.controller;

import com.cyp.prompt.expert_backend.dto.request.CreateChatRequest;
import com.cyp.prompt.expert_backend.dto.request.RenameChatRequest;
import com.cyp.prompt.expert_backend.dto.response.ChatDetailResponse;
import com.cyp.prompt.expert_backend.dto.response.ChatResponse;
import com.cyp.prompt.expert_backend.dto.response.RenameChatResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@Tag(name = "Chats", description = "Gestión de chats del usuario")
@RestController
@RequestMapping("/api/chats")
public class ChatController {

    @Operation(
            summary = "Crear chat",
            description = "Crea un nuevo chat para el usuario autenticado"
    )
    @ApiResponse(responseCode = "201", description = "Chat creado correctamente",
            content = @Content(schema = @Schema(implementation = ChatResponse.class)))
    @ApiResponse(responseCode = "400", description = "Request inválido")
    @PostMapping
    public ResponseEntity<ChatResponse> createChat(@Valid @RequestBody CreateChatRequest request) {
        // TODO: implementar con ChatService
        ChatResponse mock = new ChatResponse(
                12L,
                request.title(),
                0,
                Instant.now(),
                Instant.now()
        );
        return ResponseEntity.status(201).body(mock);
    }

    @Operation(
            summary = "Listar chats",
            description = "Lista todos los chats del usuario ordenados por fecha de última actividad descendente"
    )
    @ApiResponse(responseCode = "200", description = "Lista obtenida correctamente",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ChatResponse.class))))
    @GetMapping
    public ResponseEntity<List<ChatResponse>> getChats() {
        // TODO: implementar con ChatService
        List<ChatResponse> mock = List.of(
                new ChatResponse(12L, "Aprendiendo Docker", 4,
                        Instant.parse("2026-06-10T14:00:00Z"), Instant.parse("2026-06-10T15:30:00Z")),
                new ChatResponse(8L, "Spring Boot con JPA", 7,
                        Instant.parse("2026-06-08T09:00:00Z"), Instant.parse("2026-06-09T11:00:00Z"))
        );
        return ResponseEntity.ok(mock);
    }

    @Operation(
            summary = "Obtener chat completo",
            description = "Devuelve un chat con todos sus mensajes"
    )
    @ApiResponse(responseCode = "200", description = "Chat obtenido correctamente",
            content = @Content(schema = @Schema(implementation = ChatDetailResponse.class)))
    @ApiResponse(responseCode = "404", description = "Chat no encontrado")
    @GetMapping("/{chatId}")
    public ResponseEntity<ChatDetailResponse> getChatById(
            @Parameter(description = "ID del chat", required = true)
            @PathVariable Long chatId
    ) {
        // TODO: implementar con ChatService
        ChatDetailResponse mock = new ChatDetailResponse(
                chatId,
                "Aprendiendo Docker",
                Instant.parse("2026-06-10T14:00:00Z"),
                Instant.parse("2026-06-10T15:30:00Z"),
                List.of()
        );
        return ResponseEntity.ok(mock);
    }

    @Operation(
            summary = "Renombrar chat",
            description = "Actualiza el título de un chat existente"
    )
    @ApiResponse(responseCode = "200", description = "Chat renombrado correctamente",
            content = @Content(schema = @Schema(implementation = RenameChatResponse.class)))
    @ApiResponse(responseCode = "400", description = "Request inválido")
    @ApiResponse(responseCode = "404", description = "Chat no encontrado")
    @PatchMapping("/{chatId}")
    public ResponseEntity<RenameChatResponse> renameChat(
            @Parameter(description = "ID del chat", required = true)
            @PathVariable Long chatId,
            @Valid @RequestBody RenameChatRequest request
    ) {
        // TODO: implementar con ChatService
        RenameChatResponse mock = new RenameChatResponse(chatId, request.title(), Instant.now());
        return ResponseEntity.ok(mock);
    }

    @Operation(
            summary = "Eliminar chat",
            description = "Elimina un chat y todos sus mensajes de forma permanente"
    )
    @ApiResponse(responseCode = "204", description = "Chat eliminado correctamente")
    @ApiResponse(responseCode = "404", description = "Chat no encontrado")
    @DeleteMapping("/{chatId}")
    public ResponseEntity<Void> deleteChat(
            @Parameter(description = "ID del chat", required = true)
            @PathVariable Long chatId
    ) {
        // TODO: implementar con ChatService
        return ResponseEntity.noContent().build();
    }
}
