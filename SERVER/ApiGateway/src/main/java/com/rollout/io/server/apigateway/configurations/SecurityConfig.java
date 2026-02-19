package com.rollout.io.server.apigateway.configurations;

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

@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
public class SecurityConfig implements WebFluxConfigurer {

    private final ObjectMapper objectMapper;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").allowedMethods("*").allowedOrigins("*");
    }

    @Bean
    SecurityWebFilterChain filterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(ServerHttpSecurity.CorsSpec::disable)
                .authorizeExchange(
                        ex -> ex.pathMatchers(
                                "/public/**",
                                "/",
                                "/login",
                                "/authservice/v3/api-docs/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/webjars/**",
                                "/swagger-ui.html"
                        ).permitAll().anyExchange().authenticated())
                .exceptionHandling(
                        ex -> ex
                                .authenticationEntryPoint((
                                        exchange, exAuth) -> {

            ApiResponse<Object> apiResponse =
                    new ApiResponse<>("ACCESS DENIED [AUTHENTICATION REQUIRED]",
                            false,
                            "Please ensure you have the necessary permissions. Contact helpdesk@rollout-io.com");

            return writeResponse(exchange, apiResponse, HttpStatus.UNAUTHORIZED);
        }).accessDeniedHandler((exchange, denied) -> {

            ApiResponse<Object> apiResponse =
                    new ApiResponse<>("ACCESS DENIED [FORBIDDEN]",
                            false,
                            "Please ensure you have the necessary permissions. Contact helpdesk@rollout-io.com");

            return writeResponse(exchange, apiResponse, HttpStatus.FORBIDDEN);
        })).oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults())).build();
    }

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
