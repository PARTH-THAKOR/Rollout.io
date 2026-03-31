package com.rollout.io.server.registryserver.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.LogoutConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration for the Registry Server.
 * Handles authentication, authorization rules, and protects the application endpoints.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${secret.security.user.name}")
    private String adminUsername;

    @Value("${secret.security.user.password}")
    private String adminPassword;

    @Value("${secret.security.user.role}")
    private String adminRole;

    @Value("${secret.security.prometheus.name}")
    private String prometheusUsername;

    @Value("${secret.security.prometheus.password}")
    private String prometheusPassword;

    @Value("${secret.security.prometheus.role}")
    private String prometheusRole;

    /**
     * Endpoints restricted to PROMETHEUS role only (metrics scraping).
     */
    private static final String[] PROMETHEUS_ENDPOINTS = {
            "/actuator/prometheus"
    };

    /**
     * Endpoints restricted to ADMIN role only (dashboard & actuator management).
     */
    private static final String[] ADMIN_ENDPOINTS = {
            "/actuator/**"
    };

    /**
     * Configures in-memory users for administrative and metrics access.
     * 
     * @return UserDetailsService with predefined users
     */
    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails admin = User.builder()
                .username(adminUsername)
                .password(passwordEncoder().encode(adminPassword))
                .roles(adminRole)
                .build();

        UserDetails prometheus = User.builder()
                .username(prometheusUsername)
                .password(passwordEncoder().encode(prometheusPassword))
                .roles(prometheusRole)
                .build();

        return new InMemoryUserDetailsManager(admin, prometheus);
    }

    /**
     * Provides the password encoder used for securely checking user passwords.
     * 
     * @return PasswordEncoder instance using Bcrypt algorithm
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Configures the security filter chain, defining endpoint protection, login views, and CSRF settings.
     * 
     * @param http the HttpSecurity component to modify
     * @return the newly constructed SecurityFilterChain
     * @throws Exception if an error occurs during configuration setup
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PROMETHEUS_ENDPOINTS).hasRole("PROMETHEUS")
                        .requestMatchers(ADMIN_ENDPOINTS).hasRole("ADMIN")
                        .anyRequest().authenticated()
                ).formLogin(form -> form
                        .loginPage("/login")
                        .defaultSuccessUrl("/", true)
                        .permitAll()
                )
                .logout(LogoutConfigurer::permitAll)
                .httpBasic(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable);

        return http.build();
    }

}
