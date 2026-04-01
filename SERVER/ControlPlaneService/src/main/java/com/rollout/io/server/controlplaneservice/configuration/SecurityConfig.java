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
 * Configures the Spring Security filter chain for the Control Plane Service.
 * Implements CORS mappings, exception handlers, and validates all IAM JWT tokens 
 * for administrative actions on Projects, Flags, and Environments.
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
     * Integrates CORS mappings, defining origins, methods, and headers permitted.
     * This ensures the web dashboard/frontend can make authorized cross-origin requests.
     *
     * @param registry the CORS registry configurer
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").allowedOrigins("*").allowedMethods("*").allowedHeaders("*");
    }

    /**
     * Secures HTTP requests by evaluating JWT tokens against the Firebase Public Keys.
     *
     * @param http the HttpSecurity component to modify
     * @return the resolved Security Filter Chain
     * @throws Exception if an error occurs configuring OAuth2 resources
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(publicEndpoints).permitAll()
                .anyRequest().authenticated()
            ).exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {

            ApiResponse<Object> apiResponse = new ApiResponse<>("ACCESS DENIED [AUTHENTICATION REQUIRED]", false, "Please ensure you have the necessary permissions to access. For any help contact helpdesk@rollout-io.com");

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");

            objectMapper.writeValue(response.getOutputStream(), apiResponse);
        }).accessDeniedHandler((request, response, accessDeniedException) -> {

            ApiResponse<Object> apiResponse = new ApiResponse<>("ACCESS DENIED [FORBIDDEN]", false, "Please ensure you have the necessary permissions to access. For any help contact helpdesk@rollout-io.com");

            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");

            objectMapper.writeValue(response.getOutputStream(), apiResponse);
        })).oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }

}

