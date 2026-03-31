package com.rollout.io.server.authservice.configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.servers.Server;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .addServersItem(new Server().url("/authservice").description("Default Server URL"))
                .info(new Info().title("Rollout.io").version("1.0.0")
                        .description("<h3>Rollout.io Auth & User Service</h3>" +
                                "<p>Welcome to the <b>Auth Service</b> APIs associated with Rollout.io platform.</p>" +
                                "<h4>Service Capabilities:</h4>" +
                                "<ul>" +
                                "  <li><b>User Synchronization:</b> Seamlessly mirrors Firebase Auth identities to the platform's PostgreSQL.</li>" +
                                "  <li><b>Profile Management:</b> Update user metadata including Display Names, Avatars, and User Attributes.</li>" +
                                "  <li><b>Lifecycle Security:</b> Perform strict user provisioning or account tear-downs programmatically.</li>" +
                                "</ul>" +
                                "<p><i>All critical endpoints are protected via central Identity Access Management. A valid Firebase Bearer token must be provided.</i></p>")
                        .contact(new Contact().name("Parthsinh Thakor").email("admin@rollout.io")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components().addSecuritySchemes("bearerAuth", new SecurityScheme()
                        .name("bearerAuth").type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")
                        .description("<div style='font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; color: #e1e4e8; line-height: 1.6;'>" +
                                "<h2 style='color: #58a6ff; border-bottom: 1px solid #30363d; padding-bottom: 10px; margin-bottom: 20px;'>Auth & Identity Management</h2>" +
                                "<p style='color: #c9d1d9; font-size: 14px;'>Ensure you supply a valid Firebase JWT to identify and sync user profiles.</p></div>")));
    }

}