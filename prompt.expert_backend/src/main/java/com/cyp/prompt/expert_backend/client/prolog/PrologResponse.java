package com.cyp.prompt.expert_backend.client.prolog;

import java.util.List;

/**
 * Respuesta de {@code POST /infer} del servicio Prolog.
 *
 * <ul>
 *   <li>{@code inferences}       — se persisten en {@code Message.appliedInferences}</li>
 *   <li>{@code recommendations}  — usadas por {@code PromptBuilder} para enriquecer el prompt</li>
 *   <li>{@code additionalContext}— contexto libre que Prolog agrega al prompt enriquecido</li>
 * </ul>
 */
public record PrologResponse(
        List<String> inferences,
        List<String> recommendations,
        String additionalContext
) {}
