package com.rollout.io.server.apigateway.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rollout.io.server.apigateway.objects.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.reactive.config.CorsRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Security configuration for the API Gateway.
 * Configures CORS, CSRF, exception handling, and OAuth2 Resource Server.
 */
@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
public class SecurityConfig implements WebFluxConfigurer {

    private final ObjectMapper objectMapper;

    /**
     * Public endpoints excluded from JWT authentication.
     * Organized by category for maintainability.
     */
    private static final String[] PUBLIC_ENDPOINTS = {
            "/public/**",
            "/",
            "/login",
            "/sdkservice/apiSdk/v1/sdk/**",
            "/apiSdk/v1/sdk/**",
            "/actuator/health",
            "/actuator/prometheus",
            "/authservice/v3/api-docs/**",
            "/controlplaneservice/v3/api-docs/**",
            "/sdkservice/v3/api-docs/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/webjars/**",
            "/swagger-ui.html"
    };

    /**
     * Configures global CORS mappings.
     *
     * @param registry the CorsRegistry to modify
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").allowedMethods("*").allowedOrigins("*").allowedHeaders("*");
    }

    /**
     * Configures the security web filter chain.
     *
     * @param http the ServerHttpSecurity component to modify
     * @return the newly constructed SecurityWebFilterChain
     */
    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(Customizer.withDefaults())
                .authorizeExchange(ex -> ex
                        .pathMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .anyExchange().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((exchange, exAuth) -> {
                            ApiResponse<Object> apiResponse = new ApiResponse<>(
                                    "ACCESS DENIED [AUTHENTICATION REQUIRED]",
                                    false,
                                    "Please ensure you have the necessary permissions. Contact helpdesk@rollout-io.com"
                            );
                            return writeResponse(exchange, apiResponse, HttpStatus.UNAUTHORIZED);
                        })
                        .accessDeniedHandler((exchange, denied) -> {
                            ApiResponse<Object> apiResponse = new ApiResponse<>(
                                    "ACCESS DENIED [FORBIDDEN]",
                                    false,
                                    "Please ensure you have the necessary permissions. Contact helpdesk@rollout-io.com"
                            );
                            return writeResponse(exchange, apiResponse, HttpStatus.FORBIDDEN);
                        })
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
                .build();
    }

    /**
     * Helper method to write standard API responses to the exchange.
     *
     * @param exchange the server web exchange
     * @param apiResponse the standardized API response object
     * @param status the HTTP status format
     * @return Mono<Void> indicating when request handling is complete
     */
    private Mono<Void> writeResponse(ServerWebExchange exchange, ApiResponse<Object> apiResponse, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(apiResponse);
        } catch (Exception e) {
            bytes = new byte[0];
        }
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

}
