package com.rollout.io.server.controlplaneservice.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rollout.io.server.controlplaneservice.objects.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Security configuration for the Control Plane Service.
 * Defines authentication requirements, CORS mappings, and centralized exception handling for unauthorized access.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig implements WebMvcConfigurer {

    private final ObjectMapper objectMapper;

    private final String[] publicEndpoints = {
            "/public/**",
            "/ws/flags/**",
            "/actuator/health",
            "/actuator/prometheus",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    /**
     * Configures global CORS mappings to allow cross-origin requests from the administrative dashboard.
     *
     * @param registry the CORS registry
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("*")
                .allowedHeaders("*");
    }

    /**
     * Configures the security filter chain, enabling OAuth2 JWT resource server support.
     *
     * @param http the HttpSecurity object to configure
     * @return the built SecurityFilterChain
     * @throws Exception if configuration fails
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(publicEndpoints).permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            ApiResponse<Object> apiResponse = new ApiResponse<>(
                                    "Authentication required. Access denied.",
                                    false,
                                    "Please provide a valid JWT. Contact helpdesk@rollout.io for support."
                            );
                            writeErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, apiResponse);
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            ApiResponse<Object> apiResponse = new ApiResponse<>(
                                    "Forbidden. Insufficient permissions.",
                                    false,
                                    "Your identity is recognized, but you lack the necessary scope for this action."
                            );
                            writeErrorResponse(response, HttpServletResponse.SC_FORBIDDEN, apiResponse);
                        })
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

        return http.build();
    }

    private void writeErrorResponse(HttpServletResponse response, int status, ApiResponse<Object> payload) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        objectMapper.writeValue(response.getOutputStream(), payload);
    }

}
