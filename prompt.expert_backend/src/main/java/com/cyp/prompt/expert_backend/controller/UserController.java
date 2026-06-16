package com.cyp.prompt.expert_backend.controller;

import com.cyp.prompt.expert_backend.dto.request.CreateUserRequest;
import com.cyp.prompt.expert_backend.dto.request.LoginRequest;
import com.cyp.prompt.expert_backend.dto.request.OnboardingRequest;
import com.cyp.prompt.expert_backend.dto.request.RegisterUserRequest;
import com.cyp.prompt.expert_backend.dto.response.CreateUserResponse;
import com.cyp.prompt.expert_backend.dto.response.LoginResponse;
import com.cyp.prompt.expert_backend.dto.response.RegisterUserResponse;
import com.cyp.prompt.expert_backend.dto.response.UserResponse;
import com.cyp.prompt.expert_backend.service.UserService;
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

@Tag(name = "Users", description = "Registro de usuarios y onboarding de perfil (sin autenticación)")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(
            summary = "Registrar usuario (con credenciales — demo)",
            description = "Da de alta un usuario con nombre, email y password (texto plano, demo). " +
                    "Devuelve el userId y el estado de onboarding. No emite tokens ni sesiones."
    )
    @ApiResponse(responseCode = "201", description = "Usuario registrado correctamente",
            content = @Content(schema = @Schema(implementation = RegisterUserResponse.class)))
    @ApiResponse(responseCode = "400", description = "Request inválido (name/email/password ausentes o email mal formado)")
    @ApiResponse(responseCode = "409", description = "El email ya está registrado")
    @PostMapping("/register")
    public ResponseEntity<RegisterUserResponse> register(@Valid @RequestBody RegisterUserRequest request) {
        return ResponseEntity.status(201).body(userService.register(request));
    }

    @Operation(
            summary = "Login (demo)",
            description = "Autentica por email + password (texto plano, demo). Devuelve los datos del " +
                    "usuario y el estado de onboarding. El frontend solo almacena el userId y lo reenvía " +
                    "en el header X-User-Id. No emite tokens ni sesiones."
    )
    @ApiResponse(responseCode = "200", description = "Login correcto",
            content = @Content(schema = @Schema(implementation = LoginResponse.class)))
    @ApiResponse(responseCode = "400", description = "Request inválido")
    @ApiResponse(responseCode = "401", description = "Password incorrecta")
    @ApiResponse(responseCode = "404", description = "No existe un usuario con ese email")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @Operation(
            summary = "Registrar usuario sin credenciales (legacy)",
            description = "Da de alta un usuario con datos mínimos (nombre + email), sin password. " +
                    "Se mantiene por compatibilidad; para la demo con login usar POST /api/users/register."
    )
    @ApiResponse(responseCode = "201", description = "Usuario creado correctamente",
            content = @Content(schema = @Schema(implementation = CreateUserResponse.class)))
    @ApiResponse(responseCode = "400", description = "Request inválido (name/email ausentes o email mal formado)")
    @ApiResponse(responseCode = "409", description = "El email ya está registrado")
    @PostMapping
    public ResponseEntity<CreateUserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(201).body(userService.createUser(request));
    }

    @Operation(
            summary = "Obtener usuario",
            description = "Devuelve la información básica del usuario y el estado de su onboarding " +
                    "(onboardingComplete, calculado)."
    )
    @ApiResponse(responseCode = "200", description = "Usuario obtenido correctamente",
            content = @Content(schema = @Schema(implementation = UserResponse.class)))
    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(
            @Parameter(description = "ID del usuario", required = true)
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @Operation(
            summary = "Completar onboarding",
            description = "Actualiza los datos del perfil y reemplaza las skills del usuario. " +
                    "Tras completarse, onboardingComplete pasa a true."
    )
    @ApiResponse(responseCode = "200", description = "Onboarding completado correctamente",
            content = @Content(schema = @Schema(implementation = UserResponse.class)))
    @ApiResponse(responseCode = "400", description = "Request inválido")
    @ApiResponse(responseCode = "404", description = "Usuario o skill no encontrados")
    @PutMapping("/{id}/onboarding")
    public ResponseEntity<UserResponse> completeOnboarding(
            @Parameter(description = "ID del usuario", required = true)
            @PathVariable Long id,
            @Valid @RequestBody OnboardingRequest request
    ) {
        return ResponseEntity.ok(userService.completeOnboarding(id, request));
    }
}
