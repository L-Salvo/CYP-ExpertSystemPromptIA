package com.cyp.prompt.expert_backend.service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cyp.prompt.expert_backend.dto.response.SkillCatalogResponse;
import com.cyp.prompt.expert_backend.entity.Skill;
import com.cyp.prompt.expert_backend.enums.SkillCategory;
import com.cyp.prompt.expert_backend.repository.SkillRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;

    @Transactional(readOnly = true)
    public List<SkillCatalogResponse> getAllSkills(String category) {
        List<Skill> skills = (category == null || category.isBlank())
                ? skillRepository.findAll()
                : findByCategoryParam(category);

        return skills.stream()
                .map(SkillService::toCatalogResponse)
                .toList();
    }

    private List<Skill> findByCategoryParam(String category) {
        SkillCategory parsed = parseCategory(category)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid skill category: '" + category + "'. Valid values are: "
                        + Arrays.toString(SkillCategory.values())));
        return skillRepository.findByCategory(parsed);
    }

    private static Optional<SkillCategory> parseCategory(String category) {
        try {
            return java.util.Optional.of(SkillCategory.valueOf(category.trim().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            return java.util.Optional.empty();
        }
    }

    private static SkillCatalogResponse toCatalogResponse(Skill skill) {
        return new SkillCatalogResponse(skill.getId(), skill.getName(), skill.getCategory());
    }
}
