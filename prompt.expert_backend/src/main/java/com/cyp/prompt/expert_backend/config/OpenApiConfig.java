package com.cyp.prompt.expert_backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Sistema Experto para Personalización de Prompts — API")
                        .version("v1")
                        .description("""
                                API REST del backend Spring Boot para el Sistema Experto de Prompts.
                                Permite gestionar perfiles de usuario, enriquecer prompts mediante
                                inferencias de SWI-Prolog y opcionalmente enviarlos a un modelo de IA externo.
                                """)
                );
    }
}
