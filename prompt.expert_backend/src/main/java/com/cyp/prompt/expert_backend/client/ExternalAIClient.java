package com.cyp.prompt.expert_backend.client;

import java.util.List;
import java.util.Map;

import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.cyp.prompt.expert_backend.exception.ExternalServiceException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementación HTTP de {@link AIClient} preparada para un proveedor de IA externo
 * compatible con la API de chat completions (OpenAI, Grok u otro compatible).
 *
 * <p>Activada con {@code ai.mock=false} (o cuando la propiedad no está definida).
 * La URL base, la API key, el modelo y los timeouts se configuran en
 * {@link com.cyp.prompt.expert_backend.config.AIClientConfig}. Esta clase no contiene
 * credenciales ni endpoints hardcodeados: todo es inyectado.</p>
 *
 * <p>Sigue el mismo estilo de manejo de errores que
 * {@link PrologRestClient}: cualquier fallo de comunicación o respuesta inválida se
 * traduce a {@link ExternalServiceException}, que el {@code GlobalExceptionHandler}
 * mapea a HTTP 503.</p>
 */
@Slf4j
@RequiredArgsConstructor
public class ExternalAIClient implements AIClient {

    private static final String COMPLETIONS_PATH = "/chat/completions";

    private final RestClient restClient;
    private final String model;

    @Override
    public String generate(String enrichedPrompt) {
        try {
            Map<String, Object> requestBody = buildRequestBody(enrichedPrompt);

            Map<String, Object> response = restClient.post()
                    .uri(COMPLETIONS_PATH)
                    .body(requestBody)
                    .retrieve()
                    .onStatus(
                            status -> status.is4xxClientError(),
                            (req, res) -> {
                                log.warn("[ExternalAIClient] El proveedor de IA rechazó el request: HTTP {}",
                                        res.getStatusCode());
                                throw new ExternalServiceException(
                                        "El servicio de IA rechazó el request: " + res.getStatusCode());
                            }
                    )
                    .onStatus(
                            status -> status.is5xxServerError(),
                            (req, res) -> {
                                log.error("[ExternalAIClient] Error interno en el proveedor de IA: HTTP {}",
                                        res.getStatusCode());
                                throw new ExternalServiceException("Servicio de IA no disponible");
                            }
                    )
                    .body(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

            return extractContent(response);

        } catch (ExternalServiceException ex) {
            throw ex;
        } catch (ResourceAccessException ex) {
            // Timeout o conexión rechazada
            log.error("[ExternalAIClient] No se puede conectar al servicio de IA: {}", ex.getMessage());
            throw new ExternalServiceException("Servicio de IA no disponible", ex);
        } catch (RestClientResponseException ex) {
            log.error("[ExternalAIClient] Error inesperado del servicio de IA: {}", ex.getMessage());
            throw new ExternalServiceException("Servicio de IA no disponible", ex);
        }
    }

    /**
     * Construye el cuerpo del request con el modelo configurado y el prompt enriquecido
     * como mensaje de usuario, según el formato de chat completions.
     */
    private Map<String, Object> buildRequestBody(String enrichedPrompt) {
        return Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "user", "content", enrichedPrompt == null ? "" : enrichedPrompt)
                )
        );
    }

    /**
     * Extrae el texto generado de {@code choices[0].message.content}. Si la estructura
     * no es la esperada, lo trata como un fallo del servicio externo.
     */
    @SuppressWarnings("unchecked")
    private String extractContent(Map<String, Object> response) {
        if (response == null) {
            throw new ExternalServiceException("El servicio de IA devolvió una respuesta vacía.");
        }
        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new ExternalServiceException("El servicio de IA devolvió una respuesta sin contenido.");
            }
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = message == null ? null : (String) message.get("content");
            if (content == null) {
                throw new ExternalServiceException("El servicio de IA devolvió una respuesta sin contenido.");
            }
            return content;
        } catch (ClassCastException ex) {
            log.error("[ExternalAIClient] Formato de respuesta inesperado del servicio de IA", ex);
            throw new ExternalServiceException("El servicio de IA devolvió una respuesta con formato inválido.", ex);
        }
    }
}
