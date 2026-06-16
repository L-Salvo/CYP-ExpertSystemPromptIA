package com.cyp.prompt.expert_backend.client;

import com.cyp.prompt.expert_backend.client.prolog.PrologRequest;
import com.cyp.prompt.expert_backend.client.prolog.PrologResponse;
import com.cyp.prompt.expert_backend.exception.ExternalServiceException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.nio.charset.StandardCharsets;

/**
 * Implementación HTTP de {@link PrologClient} que consume {@code POST /infer}
 * del servicio SWI-Prolog usando {@link RestClient} (Spring 6.1+).
 *
 * <p>Activada con {@code prolog.mock=false} (o cuando la propiedad no está definida).
 * Los timeouts se configuran en {@link com.cyp.prompt.expert_backend.config.PrologClientConfig}.
 */
@Slf4j
@RequiredArgsConstructor
public class PrologRestClient implements PrologClient {

    private final RestClient restClient;

    // ===== DIAGNÓSTICO TEMPORAL (remover tras depurar) =====
    // FAIL_ON_TRAILING_TOKENS hace que readValue falle si hay contenido extra
    // después del JSON (p. ej. una segunda respuesta "HTTP/1.1 ..."), reproduciendo
    // el síntoma para capturar el stacktrace real.
    private static final ObjectMapper DIAG_MAPPER = new ObjectMapper()
            .enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS);

    @Override
    public PrologResponse infer(PrologRequest request) {
        // ----- DIAG (1): request serializado a JSON antes de llamar a Prolog -----
        try {
            log.warn("[DIAG] PrologRequest enviado a Prolog = {}", DIAG_MAPPER.writeValueAsString(request));
        } catch (Exception diagEx) {
            log.warn("[DIAG] No se pudo serializar PrologRequest: {}", diagEx.toString());
        }

        try {
            // Se lee el cuerpo CRUDO (byte[]) para loguearlo ANTES de deserializar.
            ResponseEntity<byte[]> entity = restClient.post()
                    .uri("/infer")
                    .body(request)
                    .retrieve()
                    .onStatus(
                            status -> status.is4xxClientError(),
                            (req, res) -> {
                                log.warn("[PrologRestClient] Prolog rechazó el request: HTTP {}", res.getStatusCode());
                                throw new ExternalServiceException(
                                        "El servicio Prolog rechazó el request: " + res.getStatusCode());
                            }
                    )
                    .onStatus(
                            status -> status.is5xxServerError(),
                            (req, res) -> {
                                log.error("[PrologRestClient] Error interno en Prolog: HTTP {}", res.getStatusCode());
                                throw new ExternalServiceException(
                                        "El servicio de inferencia Prolog no está disponible. Intente nuevamente.");
                            }
                    )
                    .toEntity(byte[].class);

            // ----- DIAG (2)(3): status HTTP + body crudo recibido -----
            int statusCode = entity.getStatusCode().value();
            byte[] raw = entity.getBody();
            int len = (raw == null) ? 0 : raw.length;
            log.warn("[DIAG] Prolog HTTP status = {}", statusCode);
            log.warn("[DIAG] Prolog raw body length = {} bytes", len);
            log.warn("[DIAG] Prolog raw body (UTF-8) = {}",
                    raw == null ? "<null>" : new String(raw, StandardCharsets.UTF_8));
            log.warn("[DIAG] Prolog raw body (hex, últimos 48 bytes) = {}", hexTail(raw, 48));

            // ----- Deserialización con captura del stacktrace real (4) -----
            PrologResponse response;
            try {
                response = DIAG_MAPPER.readValue(raw, PrologResponse.class);
            } catch (Exception parseEx) {
                log.error("[DIAG] EXCEPCIÓN REAL al deserializar la respuesta de Prolog "
                        + "(ver 'raw body' arriba)", parseEx);
                throw new ExternalServiceException(
                        "Error deserializando la respuesta de Prolog (diagnóstico).", parseEx);
            }

            if (response == null) {
                throw new ExternalServiceException(
                        "El servicio de inferencia Prolog devolvió una respuesta vacía.");
            }
            return response;

        } catch (ExternalServiceException ex) {
            throw ex;
        } catch (ResourceAccessException ex) {
            // Timeout o conexión rechazada
            log.error("[PrologRestClient] No se puede conectar a Prolog", ex);
            throw new ExternalServiceException(
                    "No se puede conectar al servicio de inferencia Prolog. Verifique que esté activo.", ex);
        } catch (RestClientResponseException ex) {
            log.error("[PrologRestClient] Error inesperado de Prolog", ex);
            throw new ExternalServiceException(
                    "El servicio de inferencia Prolog no está disponible. Intente nuevamente.", ex);
        }
    }

    // ===== DIAGNÓSTICO TEMPORAL =====
    private static String hexTail(byte[] data, int n) {
        if (data == null || data.length == 0) {
            return "<empty>";
        }
        int from = Math.max(0, data.length - n);
        StringBuilder sb = new StringBuilder();
        for (int i = from; i < data.length; i++) {
            sb.append(String.format("%02x ", data[i]));
        }
        return sb.toString().trim();
    }
}
