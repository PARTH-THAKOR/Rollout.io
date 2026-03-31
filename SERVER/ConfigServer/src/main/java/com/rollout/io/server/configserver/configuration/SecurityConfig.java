package com.rollout.io.server.configserver.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration for the Config Server.
 * Secures configuration endpoints and permits unrestricted access to the health endpoint.
 */
@Configuration
public class SecurityConfig {

    /**
     * Public endpoints excluded from authentication.
     */
    private static final String[] PUBLIC_ENDPOINTS = {
            "/actuator/health"
    };

    /**
     * Configures the security filter chain to disable CSRF and secure HTTP requests.
     * 
     * @param http the HttpSecurity component to modify
     * @return the newly constructed SecurityFilterChain
     * @throws Exception if an error occurs during configuration setup
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .anyRequest().authenticated()
                )
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

}
