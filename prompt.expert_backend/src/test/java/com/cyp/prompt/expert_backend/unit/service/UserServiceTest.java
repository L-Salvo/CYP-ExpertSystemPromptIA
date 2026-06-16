package com.cyp.prompt.expert_backend.unit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cyp.prompt.expert_backend.dto.request.CreateUserRequest;
import com.cyp.prompt.expert_backend.dto.request.LoginRequest;
import com.cyp.prompt.expert_backend.dto.request.OnboardingRequest;
import com.cyp.prompt.expert_backend.dto.request.OnboardingSkillRequest;
import com.cyp.prompt.expert_backend.dto.request.RegisterUserRequest;
import com.cyp.prompt.expert_backend.dto.response.CreateUserResponse;
import com.cyp.prompt.expert_backend.dto.response.LoginResponse;
import com.cyp.prompt.expert_backend.dto.response.RegisterUserResponse;
import com.cyp.prompt.expert_backend.dto.response.UserResponse;
import com.cyp.prompt.expert_backend.entity.Skill;
import com.cyp.prompt.expert_backend.entity.User;
import com.cyp.prompt.expert_backend.entity.UserSkill;
import com.cyp.prompt.expert_backend.enums.EducationLevel;
import com.cyp.prompt.expert_backend.enums.SkillCategory;
import com.cyp.prompt.expert_backend.exception.ConflictException;
import com.cyp.prompt.expert_backend.exception.ResourceNotFoundException;
import com.cyp.prompt.expert_backend.exception.UnauthorizedException;
import com.cyp.prompt.expert_backend.repository.SkillRepository;
import com.cyp.prompt.expert_backend.repository.UserRepository;
import com.cyp.prompt.expert_backend.repository.UserSkillRepository;
import com.cyp.prompt.expert_backend.service.UserService;

/**
 * Tests unitarios de {@link UserService}. Repositorios mockeados con Mockito;
 * sin contexto Spring ni base de datos.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserSkillRepository userSkillRepository;
    @Mock
    private SkillRepository skillRepository;

    @InjectMocks
    private UserService userService;

    private Skill javaSkill;
    private Skill springSkill;

    @BeforeEach
    void setUp() {
        javaSkill = Skill.builder().id(1L).name("Java").category(SkillCategory.BACKEND).build();
        springSkill = Skill.builder().id(2L).name("Spring Boot").category(SkillCategory.BACKEND).build();
    }

    // ---- registro con credenciales (demo) ----

    @Test
    @DisplayName("register crea un usuario con password y onboardingComplete=false")
    void register_success() {
        RegisterUserRequest request = new RegisterUserRequest("Pedro", "pedro@test.com", "1234");
        given(userRepository.existsByEmail("pedro@test.com")).willReturn(false);
        given(userRepository.save(any(User.class))).willAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(5L);
            return u;
        });

        RegisterUserResponse response = userService.register(request);

        assertThat(response.userId()).isEqualTo(5L);
        assertThat(response.onboardingComplete()).isFalse();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        // La password se guarda tal cual (texto plano, demo).
        assertThat(captor.getValue().getPassword()).isEqualTo("1234");
    }

    @Test
    @DisplayName("register lanza ConflictException si el email ya existe")
    void register_duplicateEmail_throws() {
        RegisterUserRequest request = new RegisterUserRequest("Pedro", "pedro@test.com", "1234");
        given(userRepository.existsByEmail("pedro@test.com")).willReturn(true);

        assertThatThrownBy(() -> userService.register(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("pedro@test.com");

        verify(userRepository, never()).save(any(User.class));
    }

    // ---- login (demo) ----

    @Test
    @DisplayName("login exitoso devuelve los datos del usuario y su estado de onboarding")
    void login_success() {
        User user = User.builder()
                .id(5L).name("Pedro").email("pedro@test.com").password("1234")
                .educationLevel(EducationLevel.UNIVERSITY_STUDENT).studyYear(3).worksInIT(true)
                .build();
        UserSkill us = UserSkill.builder().id(1L).user(user).skill(javaSkill).level(8).build();
        given(userRepository.findByEmail("pedro@test.com")).willReturn(Optional.of(user));
        given(userSkillRepository.findByUserId(5L)).willReturn(List.of(us));

        LoginResponse response = userService.login(new LoginRequest("pedro@test.com", "1234"));

        assertThat(response.userId()).isEqualTo(5L);
        assertThat(response.name()).isEqualTo("Pedro");
        assertThat(response.email()).isEqualTo("pedro@test.com");
        assertThat(response.onboardingComplete()).isTrue();
    }

    @Test
    @DisplayName("login con password incorrecta lanza UnauthorizedException (401)")
    void login_wrongPassword_throws() {
        User user = User.builder()
                .id(5L).name("Pedro").email("pedro@test.com").password("1234").build();
        given(userRepository.findByEmail("pedro@test.com")).willReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.login(new LoginRequest("pedro@test.com", "wrong")))
                .isInstanceOf(UnauthorizedException.class);

        verify(userSkillRepository, never()).findByUserId(any());
    }

    @Test
    @DisplayName("login con email inexistente lanza ResourceNotFoundException (404)")
    void login_unknownEmail_throws() {
        given(userRepository.findByEmail("nadie@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> userService.login(new LoginRequest("nadie@test.com", "1234")))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("nadie@test.com");
    }

    // ---- creación de usuario ----

    @Test
    @DisplayName("createUser registra un usuario nuevo con datos mínimos")
    void createUser_success() {
        CreateUserRequest request = new CreateUserRequest("Juan Perez", "juan@example.com");
        given(userRepository.existsByEmail("juan@example.com")).willReturn(false);
        given(userRepository.save(any(User.class))).willAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(2L);
            return u;
        });

        CreateUserResponse response = userService.createUser(request);

        assertThat(response.userId()).isEqualTo(2L);
        assertThat(response.name()).isEqualTo("Juan Perez");
        assertThat(response.email()).isEqualTo("juan@example.com");

        // El usuario se persiste SIN datos de perfil (estado pre-onboarding).
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getEducationLevel()).isNull();
        assertThat(saved.getStudyYear()).isNull();
        assertThat(saved.getWorksInIT()).isNull();
    }

    // ---- email duplicado ----

    @Test
    @DisplayName("createUser lanza ConflictException si el email ya existe")
    void createUser_duplicateEmail_throws() {
        CreateUserRequest request = new CreateUserRequest("Juan Perez", "juan@example.com");
        given(userRepository.existsByEmail("juan@example.com")).willReturn(true);

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("juan@example.com");

        verify(userRepository, never()).save(any(User.class));
    }

    // ---- onboarding exitoso ----

    @Test
    @DisplayName("completeOnboarding actualiza el perfil y reemplaza las skills")
    void completeOnboarding_success() {
        User user = User.builder().id(2L).name("Juan Perez").email("juan@example.com").build();
        OnboardingRequest request = new OnboardingRequest(
                EducationLevel.UNIVERSITY_STUDENT, 3, true,
                List.of(new OnboardingSkillRequest(1L, 8), new OnboardingSkillRequest(2L, 7))
        );
        UserSkill skillVieja = UserSkill.builder().id(99L).user(user).skill(javaSkill).level(2).build();

        given(userRepository.findById(2L)).willReturn(Optional.of(user));
        given(skillRepository.findById(1L)).willReturn(Optional.of(javaSkill));
        given(skillRepository.findById(2L)).willReturn(Optional.of(springSkill));
        given(userSkillRepository.findByUserId(2L)).willReturn(List.of(skillVieja));
        given(userSkillRepository.saveAll(anyList())).willAnswer(inv -> inv.getArgument(0));

        UserResponse response = userService.completeOnboarding(2L, request);

        // Datos de perfil actualizados.
        assertThat(user.getEducationLevel()).isEqualTo(EducationLevel.UNIVERSITY_STUDENT);
        assertThat(user.getStudyYear()).isEqualTo(3);
        assertThat(user.getWorksInIT()).isTrue();

        // Las skills viejas se eliminan antes de insertar las nuevas.
        verify(userSkillRepository).deleteAll(List.of(skillVieja));
        verify(userSkillRepository).flush();
        ArgumentCaptor<List<UserSkill>> captor = ArgumentCaptor.forClass(List.class);
        verify(userSkillRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(2)
                .extracting(us -> us.getSkill().getId(), UserSkill::getLevel)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(1L, 8),
                        org.assertj.core.groups.Tuple.tuple(2L, 7));

        // Respuesta con perfil completo.
        assertThat(response.onboardingComplete()).isTrue();
        assertThat(response.skills()).hasSize(2);
    }

    // ---- onboarding con skill inexistente ----

    @Test
    @DisplayName("completeOnboarding lanza 404 si una skill no existe y no muta el perfil")
    void completeOnboarding_skillNotFound_throws() {
        User user = User.builder().id(2L).name("Juan Perez").email("juan@example.com").build();
        OnboardingRequest request = new OnboardingRequest(
                EducationLevel.UNIVERSITY_STUDENT, 3, true,
                List.of(new OnboardingSkillRequest(999L, 8))
        );
        given(userRepository.findById(2L)).willReturn(Optional.of(user));
        given(skillRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> userService.completeOnboarding(2L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999");

        // Validación previa: no se tocó el perfil ni las skills existentes.
        assertThat(user.getEducationLevel()).isNull();
        verify(userRepository, never()).save(any(User.class));
        verify(userSkillRepository, never()).deleteAll(anyList());
        verify(userSkillRepository, never()).saveAll(anyList());
    }

    // ---- cálculo de onboardingComplete ----

    @Test
    @DisplayName("getUser devuelve onboardingComplete=true cuando el perfil está completo")
    void onboardingComplete_trueWhenProfileComplete() {
        User user = User.builder()
                .id(2L).name("Juan").email("juan@example.com")
                .educationLevel(EducationLevel.UNIVERSITY_STUDENT).studyYear(3).worksInIT(true)
                .build();
        UserSkill us = UserSkill.builder().id(5L).user(user).skill(javaSkill).level(8).build();
        given(userRepository.findById(2L)).willReturn(Optional.of(user));
        given(userSkillRepository.findByUserId(2L)).willReturn(List.of(us));

        assertThat(userService.getUser(2L).onboardingComplete()).isTrue();
    }

    @Test
    @DisplayName("getUser devuelve onboardingComplete=false si falta un dato del perfil")
    void onboardingComplete_falseWhenFieldMissing() {
        // studyYear ausente → incompleto.
        User user = User.builder()
                .id(2L).name("Juan").email("juan@example.com")
                .educationLevel(EducationLevel.GRADUATED).worksInIT(false)
                .build();
        UserSkill us = UserSkill.builder().id(5L).user(user).skill(javaSkill).level(8).build();
        given(userRepository.findById(2L)).willReturn(Optional.of(user));
        given(userSkillRepository.findByUserId(2L)).willReturn(List.of(us));

        assertThat(userService.getUser(2L).onboardingComplete()).isFalse();
    }

    @Test
    @DisplayName("getUser devuelve onboardingComplete=false si no hay skills")
    void onboardingComplete_falseWhenNoSkills() {
        User user = User.builder()
                .id(2L).name("Juan").email("juan@example.com")
                .educationLevel(EducationLevel.UNIVERSITY_STUDENT).studyYear(3).worksInIT(true)
                .build();
        given(userRepository.findById(2L)).willReturn(Optional.of(user));
        given(userSkillRepository.findByUserId(2L)).willReturn(List.of());

        UserResponse response = userService.getUser(2L);
        assertThat(response.onboardingComplete()).isFalse();
        assertThat(response.skills()).isEmpty();
    }

    @Test
    @DisplayName("getUser lanza ResourceNotFoundException si el usuario no existe")
    void getUser_notFound_throws() {
        given(userRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUser(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }
}
