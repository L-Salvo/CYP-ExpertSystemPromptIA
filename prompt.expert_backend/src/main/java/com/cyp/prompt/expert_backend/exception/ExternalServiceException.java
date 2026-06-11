package com.cyp.prompt.expert_backend.exception;

/**
 * Se lanza cuando un servicio externo (Prolog o IA) no está disponible o falla.
 * El {@code GlobalExceptionHandler} la traduce a HTTP 503 Service Unavailable.
 */
public class ExternalServiceException extends RuntimeException {

    public ExternalServiceException(String message) {
        super(message);
    }

    public ExternalServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
