package com.cyp.prompt.expert_backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cyp.prompt.expert_backend.dto.response.ProfileResponse;
import com.cyp.prompt.expert_backend.dto.response.SkillResponse;
import com.cyp.prompt.expert_backend.entity.Skill;
import com.cyp.prompt.expert_backend.entity.User;
import com.cyp.prompt.expert_backend.entity.UserSkill;
import com.cyp.prompt.expert_backend.exception.ResourceNotFoundException;
import com.cyp.prompt.expert_backend.repository.SkillRepository;
import com.cyp.prompt.expert_backend.repository.UserRepository;
import com.cyp.prompt.expert_backend.repository.UserSkillRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<UserSkill> userSkills = userSkillRepository.findByUserId(userId);
        List<SkillResponse> skills = userSkills.stream()
                .map(ProfileService::toSkillResponse)
                .toList();

        return new ProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getEducationLevel(),
                user.getStudyYear(),
                user.getWorksInIT(),
                skills,
                user.getCreatedAt()
        );
    }

    @Transactional
    public SkillResponse updateSkillLevel(Long userId, Long skillId, Integer level) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + skillId));

        UserSkill userSkill = userSkillRepository.findByUserIdAndSkillId(userId, skillId)
                .orElseGet(() -> UserSkill.builder()
                        .user(user)
                        .skill(skill)
                        .build());
        userSkill.setLevel(level);

        UserSkill saved = userSkillRepository.save(userSkill);
        return toSkillResponse(saved);
    }

    private static SkillResponse toSkillResponse(UserSkill userSkill) {
        Skill skill = userSkill.getSkill();
        return new SkillResponse(skill.getId(), skill.getName(), userSkill.getLevel());
    }
}
