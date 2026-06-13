package com.cyp.prompt.expert_backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.cyp.prompt.expert_backend.client.prolog.PrologResponse;

/**
 * Construye el prompt enriquecido que se enviará al modelo de IA.
 *
 * <p>Responsabilidad única: combinar el prompt original del usuario con el
 * contexto y las directrices que produjo el motor Prolog, en un único texto
 * estructurado.</p>
 *
 * <p><b>Decisión arquitectónica:</b> el enriquecimiento se construye a partir de
 * {@link PrologResponse#additionalContext()} y {@link PrologResponse#recommendations()}.
 * Las inferencias ({@link PrologResponse#inferences()}) <i>no</i> intervienen aquí:
 * existen para persistencia, auditoría, debugging y analytics, pero la inteligencia
 * de dominio (qué significa {@code advanced_java}, {@code needs_docker}, etc.) vive
 * en el motor Prolog. Este componente no conoce ni interpreta inferencias concretas.</p>
 *
 * <p>Estructura del resultado:</p>
 * <pre>
 * CONTEXTO DEL USUARIO
 * [additionalContext]
 *
 * DIRECTRICES
 * - recommendation 1
 * - recommendation 2
 *
 * CONSULTA DEL USUARIO
 * [originalPrompt]
 * </pre>
 */
@Component
public class PromptBuilder {

    private static final String SECTION_CONTEXT    = "CONTEXTO DEL USUARIO";
    private static final String SECTION_GUIDELINES = "DIRECTRICES";
    private static final String SECTION_QUERY      = "CONSULTA DEL USUARIO";

    private static final String SECTION_SEPARATOR = "\n\n";
    private static final String LINE_SEPARATOR    = "\n";
    private static final String BULLET            = "- ";

    /**
     * Combina el prompt original con el contexto y las directrices de Prolog.
     *
     * <ul>
     *   <li>Si {@code additionalContext} está vacío, se omite la sección CONTEXTO DEL USUARIO.</li>
     *   <li>Si {@code recommendations} está vacía, se omite la sección DIRECTRICES.</li>
     *   <li>Si ambas están vacías, se devuelve únicamente el prompt original.</li>
     * </ul>
     *
     * @param originalPrompt  consulta tal cual la escribió el usuario
     * @param prologResponse  respuesta del motor Prolog (puede ser {@code null})
     * @return el prompt enriquecido, sin líneas vacías innecesarias
     */
    public String buildEnrichedPrompt(String originalPrompt, PrologResponse prologResponse) {
        String prompt = safe(originalPrompt);

        List<String> sections = new ArrayList<>();

        String contextSection = buildContextSection(prologResponse);
        if (contextSection != null) {
            sections.add(contextSection);
        }

        String guidelinesSection = buildGuidelinesSection(prologResponse);
        if (guidelinesSection != null) {
            sections.add(guidelinesSection);
        }

        // Sin contexto ni directrices, el prompt enriquecido es el prompt original.
        if (sections.isEmpty()) {
            return prompt;
        }

        sections.add(SECTION_QUERY + LINE_SEPARATOR + prompt);
        return String.join(SECTION_SEPARATOR, sections);
    }

    private String buildContextSection(PrologResponse prologResponse) {
        if (prologResponse == null) {
            return null;
        }
        String additionalContext = prologResponse.additionalContext();
        if (!StringUtils.hasText(additionalContext)) {
            return null;
        }
        return SECTION_CONTEXT + LINE_SEPARATOR + additionalContext.strip();
    }

    private String buildGuidelinesSection(PrologResponse prologResponse) {
        if (prologResponse == null || prologResponse.recommendations() == null) {
            return null;
        }
        List<String> bullets = prologResponse.recommendations().stream()
                .filter(StringUtils::hasText)
                .map(rec -> BULLET + rec.strip())
                .toList();
        if (bullets.isEmpty()) {
            return null;
        }
        return SECTION_GUIDELINES + LINE_SEPARATOR + String.join(LINE_SEPARATOR, bullets);
    }

    private static String safe(String value) {
        return value == null ? "" : value.strip();
    }
}
