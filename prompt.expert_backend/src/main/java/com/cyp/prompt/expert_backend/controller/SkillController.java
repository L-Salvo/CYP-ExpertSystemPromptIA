package com.cyp.prompt.expert_backend.controller;

import com.cyp.prompt.expert_backend.dto.response.SkillCatalogResponse;
import com.cyp.prompt.expert_backend.service.SkillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Skills", description = "Catálogo de skills disponibles en el sistema")
@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @Operation(
            summary = "Listar skills disponibles",
            description = "Devuelve el catálogo completo de skills. Se puede filtrar por categoría."
    )
    @ApiResponse(responseCode = "200", description = "Catálogo obtenido correctamente",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = SkillCatalogResponse.class))))
    @ApiResponse(responseCode = "400", description = "Valor de category no reconocido")
    @GetMapping
    public ResponseEntity<List<SkillCatalogResponse>> getSkills(
            @Parameter(description = "Filtrar por categoría (BACKEND, FRONTEND, DATABASE, DEVOPS, CLOUD, PROGRAMMING_LANGUAGE, OTHER)")
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(skillService.getAllSkills(category));
    }
}
