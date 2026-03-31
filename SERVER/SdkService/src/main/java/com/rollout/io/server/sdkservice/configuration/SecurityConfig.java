package com.rollout.io.server.sdkservice.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rollout.io.server.sdkservice.objects.ApiResponse;
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
 * Configures the Spring Security filter chain for the SDK Service.
 * Implements CORS mappings and evaluates API key-based or public token access control.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig implements WebMvcConfigurer {

    private final ObjectMapper objectMapper;

    private final String[] publicEndpoints = {
            "/api/v1/sdk/**",
            "/actuator/health",
            "/actuator/prometheus",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    /**
     * Integrates CORS mappings.
     * This ensures the client SDKs can make secure cross-origin streaming requests.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").allowedOrigins("*").allowedMethods("*").allowedHeaders("*");
    }

    /**
     * Secures HTTP requests.
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
            
            // Notice: SDK public endpoints rely on simple X-SDK-KEY headers validated in controller/filters.
            // Other endpoints will require standard OAuth2 Firebase JWT tokens.
        return http.build();
    }
}
