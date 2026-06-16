package com.cyp.prompt.expert_backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cyp.prompt.expert_backend.dto.request.CreateUserRequest;
import com.cyp.prompt.expert_backend.dto.request.LoginRequest;
import com.cyp.prompt.expert_backend.dto.request.OnboardingRequest;
import com.cyp.prompt.expert_backend.dto.request.OnboardingSkillRequest;
import com.cyp.prompt.expert_backend.dto.request.RegisterUserRequest;
import com.cyp.prompt.expert_backend.dto.response.CreateUserResponse;
import com.cyp.prompt.expert_backend.dto.response.LoginResponse;
import com.cyp.prompt.expert_backend.dto.response.RegisterUserResponse;
import com.cyp.prompt.expert_backend.dto.response.SkillResponse;
import com.cyp.prompt.expert_backend.dto.response.UserResponse;
import com.cyp.prompt.expert_backend.entity.Skill;
import com.cyp.prompt.expert_backend.entity.User;
import com.cyp.prompt.expert_backend.entity.UserSkill;
import com.cyp.prompt.expert_backend.exception.ConflictException;
import com.cyp.prompt.expert_backend.exception.ResourceNotFoundException;
import com.cyp.prompt.expert_backend.exception.UnauthorizedException;
import com.cyp.prompt.expert_backend.repository.SkillRepository;
import com.cyp.prompt.expert_backend.repository.UserRepository;
import com.cyp.prompt.expert_backend.repository.UserSkillRepository;

import lombok.RequiredArgsConstructor;

/**
 * Gestión de alta de usuarios y onboarding de perfil (sin autenticación).
 *
 * <p>No persiste el indicador {@code onboardingComplete}: se calcula al vuelo
 * en {@link #isOnboardingComplete(User, List)} a partir del estado del perfil
 * (nivel educativo, año de cursada, worksInIT y al menos una skill).</p>
 *
 * <p>No interviene en el flujo de chats ni en el enriquecimiento Prolog.</p>
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;

    /**
     * Registra un usuario nuevo con datos mínimos (name + email). El perfil
     * (educationLevel, studyYear, worksInIT, skills) queda vacío hasta el onboarding.
     *
     * @throws ConflictException si el email ya está registrado (→ 409).
     */
    /**
     * Registra un usuario con credenciales (demo). La password se guarda en
     * TEXTO PLANO: simplificación deliberada de la demo académica (sin hashing
     * ni Spring Security). El perfil queda vacío hasta el onboarding.
     *
     * @throws ConflictException si el email ya está registrado (→ 409).
     */
    @Transactional
    public RegisterUserResponse register(RegisterUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Ya existe un usuario con el email: " + request.email());
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(request.password())   // DEMO: texto plano, sin hashing
                .build();

        User saved = userRepository.save(user);
        // Recién registrado → sin perfil ni skills → onboarding incompleto.
        return new RegisterUserResponse(saved.getId(), isOnboardingComplete(saved, List.of()));
    }

    /**
     * Autentica un usuario por email + password (demo, comparación en texto plano).
     *
     * <p>Convención de errores: email inexistente → {@link ResourceNotFoundException}
     * (404, coherente con el resto del sistema); password incorrecta →
     * {@link UnauthorizedException} (401). No emite tokens ni sesiones.</p>
     */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with email: " + request.email()));

        if (user.getPassword() == null || !user.getPassword().equals(request.password())) {
            throw new UnauthorizedException("Credenciales inválidas");
        }

        List<UserSkill> userSkills = userSkillRepository.findByUserId(user.getId());
        return new LoginResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                isOnboardingComplete(user, userSkills)
        );
    }

    @Transactional
    public CreateUserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Ya existe un usuario con el email: " + request.email());
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .build();   // educationLevel / studyYear / worksInIT quedan null (pre-onboarding)

        User saved = userRepository.save(user);
        return new CreateUserResponse(saved.getId(), saved.getName(), saved.getEmail());
    }

    /**
     * Devuelve la información del usuario más el estado de onboarding (calculado).
     *
     * @throws ResourceNotFoundException si el usuario no existe (→ 404).
     */
    @Transactional(readOnly = true)
    public UserResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<UserSkill> userSkills = userSkillRepository.findByUserId(userId);
        return toUserResponse(user, userSkills);
    }

    /**
     * Completa el onboarding: actualiza los datos del perfil y <b>reemplaza</b>
     * las skills existentes por las indicadas en el request.
     *
     * @throws ResourceNotFoundException si el usuario o alguna skill no existen (→ 404).
     */
    @Transactional
    public UserResponse completeOnboarding(Long userId, OnboardingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // 1) Resolver y validar TODAS las skills ANTES de mutar nada: si alguna
        //    no existe se lanza 404 y la transacción no altera el perfil.
        List<UserSkill> nuevasSkills = new ArrayList<>();
        for (OnboardingSkillRequest s : request.skills()) {
            Skill skill = skillRepository.findById(s.skillId())
                    .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + s.skillId()));
            nuevasSkills.add(UserSkill.builder()
                    .user(user)
                    .skill(skill)
                    .level(s.level())
                    .build());
        }

        // 2) Actualizar los datos básicos del perfil.
        user.setEducationLevel(request.educationLevel());
        user.setStudyYear(request.studyYear());
        user.setWorksInIT(request.worksInIT());
        userRepository.save(user);

        // 3) Reemplazar las skills existentes (si las hubiera) por las nuevas.
        //    flush() fuerza los DELETE antes de los INSERT para no chocar con
        //    la unique constraint (user_id, skill_id).
        List<UserSkill> existentes = userSkillRepository.findByUserId(userId);
        if (!existentes.isEmpty()) {
            userSkillRepository.deleteAll(existentes);
            userSkillRepository.flush();
        }
        List<UserSkill> guardadas = userSkillRepository.saveAll(nuevasSkills);

        return toUserResponse(user, guardadas);
    }

    // ---- helpers ----

    private static UserResponse toUserResponse(User user, List<UserSkill> userSkills) {
        List<SkillResponse> skills = userSkills.stream()
                .map(us -> new SkillResponse(us.getSkill().getId(), us.getSkill().getName(), us.getLevel()))
                .toList();

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getEducationLevel(),
                user.getStudyYear(),
                user.getWorksInIT(),
                isOnboardingComplete(user, userSkills),
                skills
        );
    }

    /**
     * El perfil se considera completo cuando están presentes el nivel educativo,
     * el año de cursada y el flag worksInIT, y existe al menos una skill asociada.
     * Es un valor derivado: se calcula aquí y no se almacena en la base.
     */
    private static boolean isOnboardingComplete(User user, List<UserSkill> userSkills) {
        return user.getEducationLevel() != null
                && user.getStudyYear() != null
                && user.getWorksInIT() != null
                && !userSkills.isEmpty();
    }
}
