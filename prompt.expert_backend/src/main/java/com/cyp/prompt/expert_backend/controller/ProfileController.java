package com.cyp.prompt.expert_backend.controller;

import com.cyp.prompt.expert_backend.dto.request.UpdateSkillLevelRequest;
import com.cyp.prompt.expert_backend.dto.response.ProfileResponse;
import com.cyp.prompt.expert_backend.dto.response.SkillResponse;
import com.cyp.prompt.expert_backend.service.ProfileService;
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

@Tag(name = "Profile", description = "Gestión del perfil del usuario y sus skills")
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    // Sustituir por SecurityContext cuando se implemente autenticación
    private static final Long FIXED_USER_ID = 1L;

    private final ProfileService profileService;

    @Operation(
            summary = "Obtener perfil del usuario",
            description = "Devuelve el perfil completo del usuario autenticado, incluyendo skills y niveles de conocimiento"
    )
    @ApiResponse(responseCode = "200", description = "Perfil obtenido correctamente",
            content = @Content(schema = @Schema(implementation = ProfileResponse.class)))
    @ApiResponse(responseCode = "404", description = "Perfil no encontrado")
    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile() {
        return ResponseEntity.ok(profileService.getProfile(FIXED_USER_ID));
    }

    @Operation(
            summary = "Actualizar nivel de una skill",
            description = "Actualiza el nivel de conocimiento del usuario para una skill específica (1–10)"
    )
    @ApiResponse(responseCode = "200", description = "Nivel actualizado correctamente",
            content = @Content(schema = @Schema(implementation = SkillResponse.class)))
    @ApiResponse(responseCode = "400", description = "Valor de level fuera del rango 1–10")
    @ApiResponse(responseCode = "404", description = "Skill no encontrada")
    @PutMapping("/skills/{skillId}")
    public ResponseEntity<SkillResponse> updateSkillLevel(
            @Parameter(description = "ID de la skill a actualizar", required = true)
            @PathVariable Long skillId,
            @Valid @RequestBody UpdateSkillLevelRequest request
    ) {
        return ResponseEntity.ok(profileService.updateSkillLevel(FIXED_USER_ID, skillId, request.level()));
    }
}
