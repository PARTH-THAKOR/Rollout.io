package com.rollout.io.server.sdkservice.configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configures the OpenAPI (Swagger) documentation for the Sdk Service.
 * Provides a clean overview of capabilities natively handling parameter resolution mapping.
 */
@Configuration
public class OpenApiConfig {

    /**
     * Initializes a fully validated OpenAPI documentation object dynamically generating visual metadata.
     *
     * @return bound swagger definitions encompassing routing capabilities visually
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .addServersItem(new Server().url("").description("PREFIX DIFFERENTIATOR"))
                .addServersItem(new Server().url("/sdkservice").description("SERVICE DIFFERENTIATOR"))
                .info(new Info()
                        .title("Rollout.io")
                        .version("v5.0.1")
                        .description(
                                "<h3>Rollout.io SDK Evaluation API</h3>" +
                                "<p>High-performance edge node responsible for deterministic flag evaluations, minimizing database latency lockups.</p>" +
                                "<h4>Service Capabilities:</h4>" +
                                "<ul>" +
                                "  <li><b>Deterministic Evaluation:</b> Executes MurmurHash3 algorithmic allocations natively, resolving client percentages perfectly.</li>" +
                                "  <li><b>Caching & Synchronization:</b> Evaluates distributed Redis properties natively to achieve sub-millisecond resolutions.</li>" +
                                "  <li><b>Telemetry Aggregation:</b> Consumes high-frequency hit analytics locally hashing against keys for later batch reporting.</li>" +
                                "</ul>" +
                                "<p><i>Standard SDK evaluations require the 'x-sdk-key' header. Internal administrative statistics require an OAuth 2 JWT.</i></p>"
                        )
                        .contact(new Contact()
                                .name("Parthsinh Thakor")
                                .email("admin@rollout.io"))
                )
                .addSecurityItem(new SecurityRequirement().addList("Google OAuth2 TokenAuth"))
                .components(new Components().addSecuritySchemes("Google OAuth2 TokenAuth", new SecurityScheme()
                        .name("Google OAuth2 TokenAuth").type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")
                        .description("Please provide a valid OAuth 2 Bearer token for private administrative endpoints. Standard edge evaluations bypass this requirement. To acquire a new token or request elevated platform access, please contact your environment administrator at admin@rollout.io.")));
    }

}
