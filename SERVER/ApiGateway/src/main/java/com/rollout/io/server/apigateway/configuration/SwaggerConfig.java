package com.rollout.io.server.apigateway.configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger API Documentation Configuration for the API Gateway.
 * Provides a unified WebFlux UI and manages JWT Bearer Token Security contexts.
 */
@Configuration
public class SwaggerConfig {

    /**
     * Constructs the custom OpenAPI configuration object detailing Gateway routes
     * and injecting the branded Authentication flow into Swagger UI.
     *
     * @return the configured OpenAPI model instance
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Rollout.io API Gateway")
                        .version("1.0.0")
                        .description("<h3>Rollout.io Central API Gateway</h3>" +
                                "<p>The unified entry point for all external routing across the Rollout.io microservice mesh.</p>" +
                                "<h4>Service Capabilities:</h4>" +
                                "<ul>" +
                                "  <li><b>Dynamic Routing:</b> Resolves and proxies secure traffic dynamically to ControlPlane, SDK, and Auth endpoints.</li>" +
                                "  <li><b>Security Tracing:</b> Implements first-layer defense enforcing global CORS policies and correlating tracing IDs.</li>" +
                                "  <li><b>Centralized Documentation:</b> Aggregates OpenAPI specifications from downstream services into a single WebFlux interface.</li>" +
                                "</ul>" +
                                "<p><i>All endpoints funneling through proxy limits require standard authentication mechanisms intact.</i></p>")
                        .contact(new io.swagger.v3.oas.models.info.Contact().name("Parthsinh Thakor").email("admin@rollout.io")))
                .addSecurityItem(new SecurityRequirement().addList("Google OAuth2 TokenAuth"))
                .components(new Components()
                        .addSecuritySchemes("Google OAuth2 TokenAuth",
                                new SecurityScheme()
                                        .name("Google OAuth2 TokenAuth")
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Please provide a valid OAuth 2 Bearer token to authorize requests mapping through the Gateway. To acquire a new token or request elevated platform access, please contact your environment administrator at admin@rollout.io.")));
    }

}