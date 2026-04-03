package com.rollout.io.server.authservice.configuration;

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
 * Configuration class for OpenAPI documentation.
 */
@Configuration
public class OpenApiConfig {

    /**
     * Configures the OpenAPI bean for the Auth Service.
     *
     * @return The configured OpenAPI instance.
     */
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .addServersItem(new Server().url("").description("PREFIX DIFFERENTIATOR"))
                .addServersItem(new Server().url("/authservice").description("SERVICE DIFFERENTIATOR"))
                .info(new Info().title("Rollout.io").version("v5.0.1")
                        .description("<h3>Rollout.io Identity & Access Management API</h3>" +
                                "<p>The source-of-truth for user lifecycles, securely connecting external Firebase identities to the platform's PostgreSQL ecosystem.</p>" +
                                "<h4>Service Capabilities:</h4>" +
                                "<ul>" +
                                "  <li><b>Identity Synchronization:</b> Seamlessly hooks into external Auth triggers to mirror and register identities across the microservice mesh.</li>" +
                                "  <li><b>Profile Governance:</b> Safely update universal metadata, display properties, and platform-wide attributes.</li>" +
                                "  <li><b>Lifecycle Security:</b> Execute strict programmatic user provisioning and hard tear-downs conforming to data protection standards.</li>" +
                                "</ul>" +
                                "<p><i>All critical endpoints are protected via central IAM. A valid OAuth 2 Bearer token must be provided.</i></p>")
                        .contact(new Contact().name("Parthsinh Thakor").email("admin@rollout.io")))
                .addSecurityItem(new SecurityRequirement().addList("Google OAuth2 TokenAuth"))
                .components(new Components().addSecuritySchemes("Google OAuth2 TokenAuth", new SecurityScheme()
                        .name("Google OAuth2 TokenAuth").type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")
                        .description("Please provide a valid OAuth 2 Bearer token to authorize your requests. Ensure your token is active and contains the necessary clearance scopes. To acquire a new token or request elevated platform access, please contact your environment administrator at admin@rollout.io.")));
    }

}