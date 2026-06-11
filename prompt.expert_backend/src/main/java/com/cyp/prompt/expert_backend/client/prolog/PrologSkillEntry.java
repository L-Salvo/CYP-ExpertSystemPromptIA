package com.cyp.prompt.expert_backend.client.prolog;

/**
 * Skill del usuario enviada a Prolog con su nivel de conocimiento.
 */
public record PrologSkillEntry(
        String name,
        int level
) {}
