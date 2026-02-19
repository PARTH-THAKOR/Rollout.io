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
                .info(new Info().title("Rollout.io").version("1.0.0").description("<h3> Secure API Gateway Authorization</h3>" + "<p>To access these APIs, you need a valid <b>Firebase Identity Token</b>.</p>" + "<h4>How to get a Token:</h4>" + "<ul>" + "  <li><b>Via Postman:</b> Call the <code>/login</code> endpoint or use Firebase Auth SDK to get the <code>idToken</code>.</li>" + "  <li><b>Via Developer:</b> Request the Backend Team for a 'Test Environment Token'.</li>" + "</ul>" + "<p>Click the <b>Authorize</b> button and paste the token below.</p>").contact(new Contact().name("Parthsinh Thakor").email("admin@rollout.io"))).addSecurityItem(new SecurityRequirement().addList("bearerAuth")).components(new Components().addSecuritySchemes("bearerAuth", new SecurityScheme().name("bearerAuth").type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT").description("<div style='font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; color: #e1e4e8; line-height: 1.6;'>" + "<h2 style='color: #58a6ff; border-bottom: 1px solid #30363d; padding-bottom: 10px; margin-bottom: 20px;'>Rollout.io Authorization</h2>" +

                // Step 1 Section
                "<div style='background: rgba(255, 255, 255, 0.05); border-left: 4px solid #007bff; padding: 20px; border-radius: 8px; margin-bottom: 15px;'>" + "  <p>Send a <b>POST</b> request to the Firebase endpoint via ApiClient/Postman:</p>" + "  <div style='font-family: monospace; font-size: 12px; font-weight: bold; color: #fff; background: #007bff; padding: 15px; border-radius: 6px; margin: 15px 0; word-break: break-all; box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);'>" + "    https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=your_firebase_apikey" + "  </div>" + "  <p style='margin-bottom: 3px;'><b>Payload (JSON):</b></p>" + "  <pre style='background: #161b22; color: #d19a66; padding: 8px; border-radius: 6px; border: 1px solid #30363d; margin: 0; font-size: 13px;'>" + "{\n" + "  \"email\": \"test@rollout.com\",\n" + "  \"password\": \"123456\",\n" + "  \"returnSecureToken\": true\n" + "}</pre>" + "</div>" +

                // Step 2 Section
                "<div style='background: rgba(255, 255, 255, 0.03); border-left: 4px solid #28a745; padding: 20px; border-radius: 8px; margin-bottom: 15px;'>" + "<div style='text-align: center; background: rgba(88, 166, 255, 0.05); padding: 15px; border-radius: 8px; border: 1px dashed #58a6ff;'>" + "  <p style='margin: 0; color: #8b949e;'>IMPORTANT: DO NOT WRITE Bearer EXPLICIT, Need help or a test token? Contact the Developer:</p>" + "  <a href='mailto:myself.parthsinh@gmail.com' style='display: inline-block; margin-top: 10px; font-size: 15px; color: #58a6ff; font-weight: bold; text-decoration: none; transition: 0.3s;'>" + "    myself.parthsinh@gmail.com" + "  </a>" + "</div>" + "</div>")));
    }

}