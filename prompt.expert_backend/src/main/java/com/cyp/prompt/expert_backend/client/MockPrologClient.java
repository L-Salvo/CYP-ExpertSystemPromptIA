package com.cyp.prompt.expert_backend.client;

import com.cyp.prompt.expert_backend.client.prolog.PrologRequest;
import com.cyp.prompt.expert_backend.client.prolog.PrologResponse;
import com.cyp.prompt.expert_backend.client.prolog.PrologSkillEntry;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

/**
 * Implementación mock de {@link PrologClient} para desarrollo local sin el servidor Prolog.
 * Genera inferencias realistas derivadas del perfil recibido en el request.
 * Activada con {@code prolog.mock=true} en las propiedades de la aplicación.
 */
@Slf4j
public class MockPrologClient implements PrologClient {

    private static final int BEGINNER_THRESHOLD = 3;
    private static final int ADVANCED_THRESHOLD  = 7;

    @Override
    public PrologResponse infer(PrologRequest request) {
        log.debug("[MockPrologClient] Generando inferencias mock para prompt: '{}'",
                request.prompt().length() > 60
                        ? request.prompt().substring(0, 60) + "..."
                        : request.prompt());

        List<String> inferences    = buildInferences(request);
        List<String> recommendations = buildRecommendations(request, inferences);
        String additionalContext   = buildAdditionalContext(request, inferences);

        return new PrologResponse(inferences, recommendations, additionalContext);
    }

    // ─── inferencias ────────────────────────────────────────────────────────

    private List<String> buildInferences(PrologRequest request) {
        List<String> inferences = new ArrayList<>();
        var profile = request.userProfile();

        // Perfil educativo
        String edu = profile.educationLevel();
        if ("UNIVERSITY_STUDENT".equals(edu) || "TERTIARY_STUDENT".equals(edu) || "SECONDARY_STUDENT".equals(edu)) {
            inferences.add("student_profile");
        }
        if ("UNIVERSITY_STUDENT".equals(edu)) {
            inferences.add("university_student");
        }

        // Situación laboral
        if (profile.worksInIT()) {
            inferences.add("works_in_it");
        }

        // Skills
        for (PrologSkillEntry skill : profile.skills()) {
            String key = skill.name().toLowerCase().replace(" ", "_");

            if (skill.level() <= BEGINNER_THRESHOLD) {
                inferences.add("beginner_" + key);
            } else if (skill.level() >= ADVANCED_THRESHOLD) {
                inferences.add("advanced_" + key);
            } else {
                inferences.add("intermediate_" + key);
            }
        }

        // Reglas derivadas de combinaciones de skills
        boolean hasAdvancedBackend = profile.skills().stream()
                .anyMatch(s -> isBackendSkill(s.name()) && s.level() >= ADVANCED_THRESHOLD);
        if (hasAdvancedBackend) {
            inferences.add("backend_developer");
        }

        boolean hasFrontend = profile.skills().stream()
                .anyMatch(s -> isFrontendSkill(s.name()));
        if (hasFrontend) {
            inferences.add("frontend_knowledge");
        }

        boolean needsDocker = profile.skills().stream()
                .anyMatch(s -> "Docker".equalsIgnoreCase(s.name()) && s.level() <= BEGINNER_THRESHOLD);
        if (needsDocker) {
            inferences.add("needs_docker");
        }

        boolean hasJavaAdvanced = profile.skills().stream()
                .anyMatch(s -> "Java".equalsIgnoreCase(s.name()) && s.level() >= ADVANCED_THRESHOLD);
        if (hasJavaAdvanced) {
            inferences.add("use_java_examples");
        }

        return inferences;
    }

    // ─── recomendaciones ────────────────────────────────────────────────────

    private List<String> buildRecommendations(PrologRequest request, List<String> inferences) {
        List<String> recs = new ArrayList<>();

        if (inferences.contains("student_profile")) {
            recs.add("Usar ejemplos prácticos y concretos orientados al aprendizaje");
        }
        if (inferences.contains("works_in_it")) {
            recs.add("Asumir contexto profesional; evitar explicaciones demasiado básicas");
        }
        if (inferences.contains("needs_docker")) {
            recs.add("Introducir Docker desde cero con analogías familiares");
            recs.add("Incluir comandos básicos: docker run, docker build, docker ps");
        }
        if (inferences.contains("use_java_examples")) {
            recs.add("Usar Java y Maven como punto de referencia para analogías");
        }
        if (inferences.contains("backend_developer")) {
            recs.add("Orientar la explicación desde una perspectiva de backend");
        }
        if (inferences.contains("frontend_knowledge")) {
            recs.add("Mencionar diferencias entre entornos frontend y backend cuando aplique");
        }
        if (recs.isEmpty()) {
            recs.add("Adaptar la explicación al nivel del usuario");
        }

        return recs;
    }

    // ─── contexto adicional ─────────────────────────────────────────────────

    private String buildAdditionalContext(PrologRequest request, List<String> inferences) {
        var profile = request.userProfile();
        StringBuilder ctx = new StringBuilder();

        ctx.append("Perfil: ").append(formatEducation(profile.educationLevel()));
        if (profile.studyYear() != null) {
            ctx.append(", año ").append(profile.studyYear());
        }
        ctx.append(profile.worksInIT() ? ", trabaja en IT" : ", no trabaja en IT").append(". ");

        long advancedCount = profile.skills().stream()
                .filter(s -> s.level() >= ADVANCED_THRESHOLD).count();
        long beginnerCount = profile.skills().stream()
                .filter(s -> s.level() <= BEGINNER_THRESHOLD).count();
        ctx.append("Skills: ").append(advancedCount).append(" avanzadas, ")
                .append(beginnerCount).append(" iniciales. ");

        if (inferences.contains("backend_developer")) {
            ctx.append("Perfil orientado a backend. ");
        }

        return ctx.toString().trim();
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    private static boolean isBackendSkill(String name) {
        return "Java".equalsIgnoreCase(name)
                || "Spring Boot".equalsIgnoreCase(name)
                || "Python".equalsIgnoreCase(name);
    }

    private static boolean isFrontendSkill(String name) {
        return "React".equalsIgnoreCase(name)
                || "TypeScript".equalsIgnoreCase(name)
                || "JavaScript".equalsIgnoreCase(name);
    }

    private static String formatEducation(String level) {
        return switch (level) {
            case "UNIVERSITY_STUDENT" -> "estudiante universitario";
            case "TERTIARY_STUDENT"   -> "estudiante terciario";
            case "SECONDARY_STUDENT"  -> "estudiante secundario";
            case "GRADUATED"          -> "graduado";
            case "POSTGRADUATE"       -> "posgrado";
            default                   -> level;
        };
    }
}
