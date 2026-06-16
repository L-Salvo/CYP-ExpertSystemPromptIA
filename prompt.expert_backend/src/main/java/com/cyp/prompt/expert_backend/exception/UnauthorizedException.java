package com.cyp.prompt.expert_backend.exception;

/**
 * Se lanza cuando las credenciales son inválidas (password incorrecta).
 * El {@code GlobalExceptionHandler} la traduce a HTTP 401 Unauthorized.
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
