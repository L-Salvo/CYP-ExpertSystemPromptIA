package com.cyp.prompt.expert_backend.exception;

/**
 * Se lanza cuando una entidad no se encuentra por su identificador.
 * El {@code GlobalExceptionHandler} la traduce a HTTP 404 Not Found.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
