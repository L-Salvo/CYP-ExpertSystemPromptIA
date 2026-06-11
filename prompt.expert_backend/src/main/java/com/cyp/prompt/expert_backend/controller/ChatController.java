package com.cyp.prompt.expert_backend.controller;

import com.cyp.prompt.expert_backend.dto.request.CreateChatRequest;
import com.cyp.prompt.expert_backend.dto.request.RenameChatRequest;
import com.cyp.prompt.expert_backend.dto.response.ChatDetailResponse;
import com.cyp.prompt.expert_backend.dto.response.ChatResponse;
import com.cyp.prompt.expert_backend.dto.response.RenameChatResponse;
import com.cyp.prompt.expert_backend.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Chats", description = "Gestión de chats del usuario")
@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    // Sustituir por SecurityContext cuando se implemente autenticación
    private static final Long FIXED_USER_ID = 1L;

    private final ChatService chatService;

    @Operation(
            summary = "Crear chat",
            description = "Crea un nuevo chat para el usuario autenticado"
    )
    @ApiResponse(responseCode = "201", description = "Chat creado correctamente",
            content = @Content(schema = @Schema(implementation = ChatResponse.class)))
    @ApiResponse(responseCode = "400", description = "Request inválido")
    @PostMapping
    public ResponseEntity<ChatResponse> createChat(@Valid @RequestBody CreateChatRequest request) {
        return ResponseEntity.status(201).body(chatService.createChat(FIXED_USER_ID, request));
    }

    @Operation(
            summary = "Listar chats",
            description = "Lista todos los chats del usuario ordenados por fecha de última actividad descendente"
    )
    @ApiResponse(responseCode = "200", description = "Lista obtenida correctamente",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ChatResponse.class))))
    @GetMapping
    public ResponseEntity<List<ChatResponse>> getChats() {
        return ResponseEntity.ok(chatService.getChats(FIXED_USER_ID));
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
        return ResponseEntity.ok(chatService.getChatById(FIXED_USER_ID, chatId));
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
        return ResponseEntity.ok(chatService.renameChat(FIXED_USER_ID, chatId, request));
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
        chatService.deleteChat(FIXED_USER_ID, chatId);
        return ResponseEntity.noContent().build();
    }
}
