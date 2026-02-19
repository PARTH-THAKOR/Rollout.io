package com.rollout.io.server.registryserver.configuration;

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

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @org.springframework.beans.factory.annotation.Value("${secret.security.user.name}")
    private String adminUsername;

    @org.springframework.beans.factory.annotation.Value("${secret.security.user.password}")
    private String adminPassword;

    @org.springframework.beans.factory.annotation.Value("${secret.security.user.role}")
    private String adminRole;

    @org.springframework.beans.factory.annotation.Value("${secret.security.prometheus.name}")
    private String prometheusUsername;

    @org.springframework.beans.factory.annotation.Value("${secret.security.prometheus.password}")
    private String prometheusPassword;

    @org.springframework.beans.factory.annotation.Value("${secret.security.prometheus.role}")
    private String prometheusRole;

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

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/prometheus").hasRole("PROMETHEUS")
                .requestMatchers("/actuator/**").hasRole("ADMIN")
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
