package com.cyp.prompt.expert_backend.client;

/**
 * Contrato de comunicación con el modelo de IA externo.
 * La implementación activa se selecciona mediante {@code ai.mock} en las propiedades:
 * <ul>
 *   <li>{@code ai.mock=true}  → {@link MockAIClient} (desarrollo sin proveedor de IA)</li>
 *   <li>{@code ai.mock=false} → {@link ExternalAIClient} (integración real)</li>
 * </ul>
 *
 * <p>Sigue el mismo patrón arquitectónico que
 * {@link com.cyp.prompt.expert_backend.client.PrologClient}: una interfaz con dos
 * implementaciones intercambiables y un {@code @Configuration} que elige el bean
 * según una propiedad.</p>
 */
public interface AIClient {

    /**
     * Envía el prompt enriquecido al modelo de IA y devuelve el texto generado.
     *
     * @param enrichedPrompt prompt ya enriquecido por el sistema experto
     * @return la respuesta textual generada por el modelo
     * @throws com.cyp.prompt.expert_backend.exception.ExternalServiceException
     *         si el servicio de IA no está disponible o devuelve un error
     */
    String generate(String enrichedPrompt);
}
