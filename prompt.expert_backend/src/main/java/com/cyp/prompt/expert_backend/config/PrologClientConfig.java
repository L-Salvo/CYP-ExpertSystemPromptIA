package com.cyp.prompt.expert_backend.config;

import com.cyp.prompt.expert_backend.client.MockPrologClient;
import com.cyp.prompt.expert_backend.client.PrologClient;
import com.cyp.prompt.expert_backend.client.PrologRestClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * Selecciona la implementación activa de {@link PrologClient} según la propiedad
 * {@code prolog.mock}:
 * <ul>
 *   <li>{@code prolog.mock=true}  → {@link MockPrologClient} (dev sin Prolog)</li>
 *   <li>{@code prolog.mock=false} → {@link PrologRestClient} (integración real)</li>
 * </ul>
 */
@Slf4j
@Configuration
public class PrologClientConfig {

    @Bean
    @ConditionalOnProperty(name = "prolog.mock", havingValue = "true")
    public PrologClient mockPrologClient() {
        log.info("[PrologClientConfig] MockPrologClient activo (prolog.mock=true)");
        return new MockPrologClient();
    }

    @Bean
    @ConditionalOnProperty(name = "prolog.mock", havingValue = "false", matchIfMissing = true)
    public PrologClient prologRestClient(
            @Value("${prolog.service.base-url}") String baseUrl,
            @Value("${prolog.service.connect-timeout-ms:3000}") long connectTimeoutMs,
            @Value("${prolog.service.read-timeout-ms:10000}") long readTimeoutMs
    ) {
        log.info("[PrologClientConfig] PrologRestClient activo → baseUrl={}, connectTimeout={}ms, readTimeout={}ms",
                baseUrl, connectTimeoutMs, readTimeoutMs);

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        factory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        RestClient restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();

        return new PrologRestClient(restClient);
    }
}
