package com.cyp.prompt.expert_backend.unit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cyp.prompt.expert_backend.dto.response.SkillCatalogResponse;
import com.cyp.prompt.expert_backend.entity.Skill;
import com.cyp.prompt.expert_backend.enums.SkillCategory;
import com.cyp.prompt.expert_backend.repository.SkillRepository;
import com.cyp.prompt.expert_backend.service.SkillService;

/**
 * Tests unitarios de {@link SkillService}. Sin contexto Spring ni base de datos.
 */
@ExtendWith(MockitoExtension.class)
class SkillServiceTest {

    @Mock
    private SkillRepository skillRepository;

    @InjectMocks
    private SkillService skillService;

    @Test
    @DisplayName("getAllSkills sin categoría devuelve el catálogo completo (findAll)")
    void getAllSkills_noCategory_returnsAll() {
        Skill java = Skill.builder().id(1L).name("Java").category(SkillCategory.PROGRAMMING_LANGUAGE).build();
        Skill docker = Skill.builder().id(2L).name("Docker").category(SkillCategory.DEVOPS).build();
        given(skillRepository.findAll()).willReturn(List.of(java, docker));

        List<SkillCatalogResponse> result = skillService.getAllSkills(null);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).skillId()).isEqualTo(1L);
        assertThat(result.get(0).name()).isEqualTo("Java");
        assertThat(result.get(0).category()).isEqualTo(SkillCategory.PROGRAMMING_LANGUAGE);
        verify(skillRepository, never()).findByCategory(any());
    }

    @Test
    @DisplayName("getAllSkills filtra por categoría válida (case-insensitive)")
    void getAllSkills_validCategory_filters() {
        Skill docker = Skill.builder().id(2L).name("Docker").category(SkillCategory.DEVOPS).build();
        given(skillRepository.findByCategory(SkillCategory.DEVOPS)).willReturn(List.of(docker));

        // "devops" en minúsculas verifica el toUpperCase() del parseo.
        List<SkillCatalogResponse> result = skillService.getAllSkills("devops");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).skillId()).isEqualTo(2L);
        assertThat(result.get(0).category()).isEqualTo(SkillCategory.DEVOPS);
        verify(skillRepository, never()).findAll();
    }

    @Test
    @DisplayName("getAllSkills con categoría inválida lanza IllegalArgumentException")
    void getAllSkills_invalidCategory_throws() {
        assertThatThrownBy(() -> skillService.getAllSkills("noexiste"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("noexiste");

        verify(skillRepository, never()).findByCategory(any());
        verify(skillRepository, never()).findAll();
    }
}
