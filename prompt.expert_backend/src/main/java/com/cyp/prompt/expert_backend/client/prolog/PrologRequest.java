package com.cyp.prompt.expert_backend.client.prolog;

/**
 * Body del request a {@code POST /infer} del servicio Prolog.
 */
public record PrologRequest(
        String prompt,
        PrologUserProfile userProfile
) {}
