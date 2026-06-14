package com.cyp.prompt.expert_backend.unit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import java.time.Instant;
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

import com.cyp.prompt.expert_backend.dto.response.ProfileResponse;
import com.cyp.prompt.expert_backend.dto.response.SkillResponse;
import com.cyp.prompt.expert_backend.entity.Skill;
import com.cyp.prompt.expert_backend.entity.User;
import com.cyp.prompt.expert_backend.entity.UserSkill;
import com.cyp.prompt.expert_backend.enums.EducationLevel;
import com.cyp.prompt.expert_backend.enums.SkillCategory;
import com.cyp.prompt.expert_backend.exception.ResourceNotFoundException;
import com.cyp.prompt.expert_backend.repository.SkillRepository;
import com.cyp.prompt.expert_backend.repository.UserRepository;
import com.cyp.prompt.expert_backend.repository.UserSkillRepository;
import com.cyp.prompt.expert_backend.service.ProfileService;

/**
 * Tests unitarios de {@link ProfileService}. Repositorios mockeados con Mockito;
 * sin contexto Spring ni base de datos.
 */
@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserSkillRepository userSkillRepository;
    @Mock
    private SkillRepository skillRepository;

    @InjectMocks
    private ProfileService profileService;

    private User user;
    private Skill dockerSkill;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .name("Lautaro")
                .email("lau@test.com")
                .educationLevel(EducationLevel.UNIVERSITY_STUDENT)
                .studyYear(3)
                .worksInIT(true)
                .createdAt(Instant.parse("2024-01-01T00:00:00Z"))
                .build();
        dockerSkill = Skill.builder()
                .id(10L)
                .name("Docker")
                .category(SkillCategory.DEVOPS)
                .build();
    }

    @Test
    @DisplayName("getProfile devuelve el perfil con sus skills mapeadas")
    void getProfile_returnsProfile() {
        UserSkill userSkill = UserSkill.builder()
                .id(5L).user(user).skill(dockerSkill).level(4).build();
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(userSkillRepository.findByUserId(1L)).willReturn(List.of(userSkill));

        ProfileResponse response = profileService.getProfile(1L);

        assertThat(response.userId()).isEqualTo(1L);
        assertThat(response.name()).isEqualTo("Lautaro");
        assertThat(response.email()).isEqualTo("lau@test.com");
        assertThat(response.educationLevel()).isEqualTo(EducationLevel.UNIVERSITY_STUDENT);
        assertThat(response.studyYear()).isEqualTo(3);
        assertThat(response.worksInIT()).isTrue();
        assertThat(response.skills()).hasSize(1);
        SkillResponse skill = response.skills().get(0);
        assertThat(skill.skillId()).isEqualTo(10L);
        assertThat(skill.name()).isEqualTo("Docker");
        assertThat(skill.level()).isEqualTo(4);
    }

    @Test
    @DisplayName("getProfile lanza ResourceNotFoundException si el usuario no existe")
    void getProfile_userNotFound_throws() {
        given(userRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.getProfile(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");

        verifyNoInteractions(userSkillRepository);
    }

    @Test
    @DisplayName("updateSkillLevel actualiza el nivel de una UserSkill existente")
    void updateSkillLevel_updatesExisting() {
        UserSkill existing = UserSkill.builder()
                .id(5L).user(user).skill(dockerSkill).level(2).build();
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(skillRepository.findById(10L)).willReturn(Optional.of(dockerSkill));
        given(userSkillRepository.findByUserIdAndSkillId(1L, 10L)).willReturn(Optional.of(existing));
        given(userSkillRepository.save(any(UserSkill.class))).willAnswer(inv -> inv.getArgument(0));

        SkillResponse response = profileService.updateSkillLevel(1L, 10L, 7);

        // Se reutiliza la instancia existente con el nivel actualizado (no se crea otra).
        assertThat(existing.getLevel()).isEqualTo(7);
        ArgumentCaptor<UserSkill> captor = ArgumentCaptor.forClass(UserSkill.class);
        verify(userSkillRepository).save(captor.capture());
        assertThat(captor.getValue()).isSameAs(existing);
        assertThat(response.skillId()).isEqualTo(10L);
        assertThat(response.level()).isEqualTo(7);
    }

    @Test
    @DisplayName("updateSkillLevel crea una UserSkill cuando no existía")
    void updateSkillLevel_createsWhenMissing() {
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(skillRepository.findById(10L)).willReturn(Optional.of(dockerSkill));
        given(userSkillRepository.findByUserIdAndSkillId(1L, 10L)).willReturn(Optional.empty());
        given(userSkillRepository.save(any(UserSkill.class))).willAnswer(inv -> inv.getArgument(0));

        SkillResponse response = profileService.updateSkillLevel(1L, 10L, 5);

        ArgumentCaptor<UserSkill> captor = ArgumentCaptor.forClass(UserSkill.class);
        verify(userSkillRepository).save(captor.capture());
        UserSkill created = captor.getValue();
        assertThat(created.getId()).isNull();
        assertThat(created.getUser()).isSameAs(user);
        assertThat(created.getSkill()).isSameAs(dockerSkill);
        assertThat(created.getLevel()).isEqualTo(5);
        assertThat(response.skillId()).isEqualTo(10L);
        assertThat(response.level()).isEqualTo(5);
    }
}
