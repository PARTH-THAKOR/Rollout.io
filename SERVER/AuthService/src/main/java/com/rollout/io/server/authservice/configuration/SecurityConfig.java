package com.rollout.io.server.authservice.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rollout.io.server.authservice.objects.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * Configures the Spring Security filter chain for the AuthService.
 * Establishes CORS mappings, exception handlers, and the JWT Resource Server.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final ObjectMapper objectMapper;

    private final String[] publicEndpoints = {
            "/public/**",
            "/actuator/health",
            "/actuator/prometheus",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    /**
     * Absolute CORS configuration using CorsFilter.
     */
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(false);
        config.addAllowedOrigin("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
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
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS).permitAll()
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

