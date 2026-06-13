package com.cyp.prompt.expert_backend.client;

import lombok.extern.slf4j.Slf4j;

/**
 * Implementación mock de {@link AIClient} para desarrollo local sin un proveedor de IA.
 * No realiza llamadas a servicios externos y genera respuestas deterministas.
 * Activada con {@code ai.mock=true} en las propiedades de la aplicación.
 *
 * <p>Análoga a {@link MockPrologClient}: comportamiento simple, predecible y
 * derivado únicamente del input recibido.</p>
 */
@Slf4j
public class MockAIClient implements AIClient {

    private static final String PREFIX = "[Mock AI Response] Respuesta generada para: ";
    private static final int PREVIEW_LENGTH = 50;

    @Override
    public String generate(String enrichedPrompt) {
        String prompt = enrichedPrompt == null ? "" : enrichedPrompt;
        log.debug("[MockAIClient] Generando respuesta mock para prompt de {} caracteres", prompt.length());

        String preview = prompt.length() > PREVIEW_LENGTH
                ? prompt.substring(0, PREVIEW_LENGTH)
                : prompt;

        return PREFIX + preview + "...";
    }
}
