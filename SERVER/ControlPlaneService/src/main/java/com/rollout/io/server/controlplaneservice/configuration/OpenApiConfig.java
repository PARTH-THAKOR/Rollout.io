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

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .addServersItem(new Server().url("/controlplaneservice").description("Default Server URL"))
                .info(new Info().title("Rollout.io").version("1.0.0")
                        .description("<h3>Rollout.io Control Plane API</h3>" +
                                "<p>Welcome to the core administrative APIs for the <b>Rollout.io</b> platform.</p>" +
                                "<h4>Service Capabilities:</h4>" +
                                "<ul>" +
                                "  <li><b>Resource Management:</b> Create, update, and manage Projects and Environments programmatically.</li>" +
                                "  <li><b>Feature Flags Governance:</b> Administer flag states, percentage rollouts, and multi-variate evaluations.</li>" +
                                "  <li><b>Targeting Rules:</b> Configure advanced audience segmentations and context-based strategies.</li>" +
                                "  <li><b>Dependency Processing:</b> Interlink flags securely ensuring hierarchical rules execution.</li>" +
                                "</ul>" +
                                "<p><i>These APIs are strictly protected via Role-Based Access Control (RBAC). A valid platform JWT must be supplied for authorization.</i></p>")
                        .contact(new Contact().name("Parthsinh Thakor").email("admin@rollout.io")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components().addSecuritySchemes("bearerAuth", new SecurityScheme()
                        .name("bearerAuth").type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")
                        .description("<div style='font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; color: #e1e4e8; line-height: 1.6;'>" +
                                "<h2 style='color: #58a6ff; border-bottom: 1px solid #30363d; padding-bottom: 10px; margin-bottom: 20px;'>Control Plane Authorization</h2>" +
                                "<p style='color: #c9d1d9; font-size: 14px;'>Ensure you supply a valid Firebase JWT linked to a privileged developer account.</p></div>")));
    }

}