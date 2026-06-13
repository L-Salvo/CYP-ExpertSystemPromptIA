package com.cyp.prompt.expert_backend.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import com.cyp.prompt.expert_backend.client.AIClient;
import com.cyp.prompt.expert_backend.client.ExternalAIClient;
import com.cyp.prompt.expert_backend.client.MockAIClient;

import lombok.extern.slf4j.Slf4j;

/**
 * Selecciona la implementación activa de {@link AIClient} según la propiedad
 * {@code ai.mock}:
 * <ul>
 *   <li>{@code ai.mock=true}  → {@link MockAIClient} (dev sin proveedor de IA)</li>
 *   <li>{@code ai.mock=false} → {@link ExternalAIClient} (integración real)</li>
 * </ul>
 *
 * <p>Mismo patrón que {@link PrologClientConfig}.</p>
 */
@Slf4j
@Configuration
public class AIClientConfig {

    @Bean
    @ConditionalOnProperty(name = "ai.mock", havingValue = "true")
    public AIClient mockAIClient() {
        log.info("[AIClientConfig] MockAIClient activo (ai.mock=true)");
        return new MockAIClient();
    }

    @Bean
    @ConditionalOnProperty(name = "ai.mock", havingValue = "false", matchIfMissing = true)
    public AIClient externalAIClient(
            @Value("${ai.provider.base-url}") String baseUrl,
            @Value("${ai.provider.api-key}") String apiKey,
            @Value("${ai.provider.model:gpt-4o-mini}") String model,
            @Value("${ai.provider.connect-timeout-ms:3000}") long connectTimeoutMs,
            @Value("${ai.provider.read-timeout-ms:30000}") long readTimeoutMs
    ) {
        log.info("[AIClientConfig] ExternalAIClient activo → baseUrl={}, model={}, connectTimeout={}ms, readTimeout={}ms",
                baseUrl, model, connectTimeoutMs, readTimeoutMs);

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        factory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        RestClient restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();

        return new ExternalAIClient(restClient, model);
    }
}
