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
 * Provides a clean overview of capabilities.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .addServersItem(new Server().url("/sdkservice").description("Default Server URL"))
                .info(new Info()
                        .title("Rollout.io SDK Service API")
                        .version("1.0.0")
                        .description(
                                "<h3>SDK Subsystem Capabilities:</h3>" +
                                "<ul>" +
                                "<li><b>High-Performance Evaluation:</b> Extremely fast real-time flag evaluation engine.</li>" +
                                "<li><b>In-Memory Caching:</b> Distributed Redis caching for sub-millisecond data reads.</li>" +
                                "<li><b>Global Graph Synchronization:</b> Background sync mechanisms pulling graphs periodically.</li>" +
                                "<li><b>State Streaming:</b> Push-based flag mutation events for connected client SDKs.</li>" +
                                "</ul>" +
                                "<p><i>Most APIs here are public SDK evaluation endpoints requiring `x-sdk-key` instead of JWTs, but administrative scopes are protected via Firebase JWT tokens.</i></p>"
                        )
                        .contact(new Contact()
                                .name("Helpdesk")
                                .email("helpdesk@rollout-io.com"))
                )
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components().addSecuritySchemes("bearerAuth", new SecurityScheme()
                        .name("bearerAuth").type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")
                        .description("<div style='font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; color: #e1e4e8; line-height: 1.6;'>" +
                                "<h2 style='color: #58a6ff; border-bottom: 1px solid #30363d; padding-bottom: 10px; margin-bottom: 20px;'>SDK Service Authorization</h2>" +
                                "<p style='color: #c9d1d9; font-size: 14px;'>Supply a valid Firebase JWT for private endpoints. Standard SDK evaluation endpoints bypass this.</p></div>")));
    }
}
