package com.cyp.prompt.expert_backend.client.prolog;

import java.util.List;

/**
 * Perfil del usuario serializado para el servicio Prolog.
 * {@code educationLevel} se envía como String para desacoplar el enum Java de Prolog.
 */
public record PrologUserProfile(
        String educationLevel,
        Integer studyYear,
        boolean worksInIT,
        List<PrologSkillEntry> skills
) {}
