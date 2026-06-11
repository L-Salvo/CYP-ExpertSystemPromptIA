package com.cyp.prompt.expert_backend.client;

import com.cyp.prompt.expert_backend.client.prolog.PrologRequest;
import com.cyp.prompt.expert_backend.client.prolog.PrologResponse;

/**
 * Contrato de comunicación con el servicio SWI-Prolog.
 * La implementación activa se selecciona mediante {@code prolog.mock} en las propiedades:
 * <ul>
 *   <li>{@code prolog.mock=true}  → {@link MockPrologClient} (desarrollo sin Prolog)</li>
 *   <li>{@code prolog.mock=false} → {@link PrologRestClient} (integración real)</li>
 * </ul>
 */
public interface PrologClient {

    /**
     * Envía el perfil del usuario y el prompt al motor de inferencia Prolog
     * y devuelve las inferencias, recomendaciones y contexto adicional generados.
     *
     * @throws com.cyp.prompt.expert_backend.exception.ExternalServiceException
     *         si Prolog no está disponible o devuelve un error
     */
    PrologResponse infer(PrologRequest request);
}
