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
            "/apiSdk/v1/sdk/**",
            "/actuator/health",
            "/actuator/prometheus",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    /**
     * Integrates generalized CORS mappings ensuring SDKs securely establish bindings cross-domain.
     *
     * @param registry generalized Spring mapping configuring boundaries
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").allowedOrigins("*").allowedMethods("*").allowedHeaders("*");
    }

    /**
     * Secures HTTP requests defining exact access limitations mapping against public resources.
     *
     * @param http declarative builder tracking constraint configurations
     * @return fully compiled mapping protecting endpoints securely
     * @throws Exception matching execution pipeline failures globally
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
