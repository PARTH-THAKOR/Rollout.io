package com.rollout.io.server.controlplaneservice.configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configures the OpenAPI documentation for the Control Plane Service.
 * Defines metadata, security schemes, and server configurations for Swagger UI.
 */
@Configuration
public class OpenApiConfig {

    /**
     * Initializes the OpenAPI definition with customized branding and security requirements.
     *
     * @return the configured OpenAPI instance
     */
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .addServersItem(new Server().url("").description("PREFIX DIFFERENTIATOR"))
                .addServersItem(new Server().url("/controlplaneservice").description("SERVICE DIFFERENTIATOR"))
                .info(new Info().title("Rollout.io").version("v5.0.1")
                        .description("<h3>Rollout.io Control Plane API</h3>" +
                                "<p>The core administrative brain of Rollout.io, responsible for standardizing feature flag governance and real-time state synchronization.</p>" +
                                "<h4>Service Capabilities:</h4>" +
                                "<ul>" +
                                "  <li><b>Multi-Tenant Scoping:</b> Manage isolated Workspaces, Projects, and Environments securely.</li>" +
                                "  <li><b>Feature Flag Governance:</b> Administer deeply nested cascading dependencies enforcing Core vs Dependent flag topological constraints.</li>" +
                                "  <li><b>Real-Time Event Engine:</b> Broadcasts state mutations instantly to active WebSocket clients for live dashboard updates.</li>" +
                                "</ul>" +
                                "<p><i>Platform administration requires a deeply validated OAuth 2 JWT token with appropriate clearance levels.</i></p>")
                        .contact(new Contact().name("Parthsinh Thakor").email("admin@rollout.io")))
                .addSecurityItem(new SecurityRequirement().addList("Google OAuth2 TokenAuth"))
                .components(new Components().addSecuritySchemes("Google OAuth2 TokenAuth", new SecurityScheme()
                        .name("Google OAuth2 TokenAuth")
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("Please provide a valid OAuth 2 Bearer token to authorize administrative requests. Ensure your token is active and contains the necessary clearance scopes. To acquire a new token or request elevated platform access, please contact your environment administrator at admin@rollout.io.")));
    }

}