package com.cyp.prompt.expert_backend.controller;

import com.cyp.prompt.expert_backend.dto.response.SkillCatalogResponse;
import com.cyp.prompt.expert_backend.enums.SkillCategory;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Skills", description = "Catálogo de skills disponibles en el sistema")
@RestController
@RequestMapping("/api/skills")
public class SkillController {

    @Operation(
            summary = "Listar skills disponibles",
            description = "Devuelve el catálogo completo de skills. Se puede filtrar por categoría."
    )
    @ApiResponse(responseCode = "200", description = "Catálogo obtenido correctamente",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = SkillCatalogResponse.class))))
    @GetMapping
    public ResponseEntity<List<SkillCatalogResponse>> getSkills(
            @Parameter(description = "Filtrar por categoría (ej: backend, frontend, devops)")
            @RequestParam(required = false) String category
    ) {
        // TODO: implementar con SkillService
        List<SkillCatalogResponse> mock = List.of(
                new SkillCatalogResponse(1L, "Java", SkillCategory.BACKEND),
                new SkillCatalogResponse(2L, "React", SkillCategory.FRONTEND),
                new SkillCatalogResponse(3L, "Docker", SkillCategory.DEVOPS)
        );
        return ResponseEntity.ok(mock);
    }
}
