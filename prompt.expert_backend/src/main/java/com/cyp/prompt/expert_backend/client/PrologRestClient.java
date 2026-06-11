package com.cyp.prompt.expert_backend.client;

import com.cyp.prompt.expert_backend.client.prolog.PrologRequest;
import com.cyp.prompt.expert_backend.client.prolog.PrologResponse;
import com.cyp.prompt.expert_backend.exception.ExternalServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

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

    @Override
    public PrologResponse infer(PrologRequest request) {
        try {
            PrologResponse response = restClient.post()
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
                    .body(PrologResponse.class);

            if (response == null) {
                throw new ExternalServiceException(
                        "El servicio de inferencia Prolog devolvió una respuesta vacía.");
            }
            return response;

        } catch (ExternalServiceException ex) {
            throw ex;
        } catch (ResourceAccessException ex) {
            // Timeout o conexión rechazada
            log.error("[PrologRestClient] No se puede conectar a Prolog: {}", ex.getMessage());
            throw new ExternalServiceException(
                    "No se puede conectar al servicio de inferencia Prolog. Verifique que esté activo.", ex);
        } catch (RestClientResponseException ex) {
            log.error("[PrologRestClient] Error inesperado de Prolog: {}", ex.getMessage());
            throw new ExternalServiceException(
                    "El servicio de inferencia Prolog no está disponible. Intente nuevamente.", ex);
        }
    }
}
