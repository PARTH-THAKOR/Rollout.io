package com.rollout.io.server.apigateway.configuration;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.security.Principal;

/**
 * General Gateway Configurations overriding default Spring behaviors.
 */
@Configuration
public class Configs {

    /**
     * Identifies the client sending the request. Needed for the Redis Rate Limiter.
     * Uses JWT Principal name if available, otherwise maps to 'anonymous'.
     *
     * @return the resolved key to track request counts.
     */
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> exchange.getPrincipal()
                .map(Principal::getName)
                .defaultIfEmpty("anonymous");
    }

}
