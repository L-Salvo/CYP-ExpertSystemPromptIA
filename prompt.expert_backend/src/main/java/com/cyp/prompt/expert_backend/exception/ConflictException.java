package com.cyp.prompt.expert_backend.exception;

/**
 * Se lanza ante una acción inválida sobre el estado actual de un recurso
 * (por ejemplo, un mensaje que ya tiene {@code aiResponse}).
 * El {@code GlobalExceptionHandler} la traduce a HTTP 409 Conflict.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
