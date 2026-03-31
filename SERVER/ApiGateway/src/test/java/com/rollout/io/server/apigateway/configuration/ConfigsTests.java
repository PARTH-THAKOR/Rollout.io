package com.rollout.io.server.apigateway.configuration;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.security.Principal;

/**
 * Tests to validate correct context bean loading and custom configurations
 * like the Redis Rate Limiter KeyResolver for incoming network traffic.
 */
@SpringBootTest
public class ConfigsTests {

    @Autowired
    private KeyResolver userKeyResolver;

    /**
     * Context configurations loads properly.
     */
    @Test
    public void testBeanExistence() {
        Assertions.assertNotNull(userKeyResolver);
    }

    /**
     * KeyResolver defaults to 'anonymous' when a user is not authenticated.
     */
    @Test
    public void testKeyResolverUnauthenticated() {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/test").build());

        Mono<String> keyMono = userKeyResolver.resolve(exchange);
        StepVerifier.create(keyMono)
                .expectNext("anonymous")
                .verifyComplete();
    }

    /**
     * KeyResolver maps explicitly to the user's name when Principal logic applies.
     */
    @Test
    public void testKeyResolverAuthenticated() {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/test").build());
        Principal principal = new UsernamePasswordAuthenticationToken("testuser@email.com", "");

        exchange.mutate().principal(Mono.just(principal)).build();

        Mono<String> keyMono = userKeyResolver.resolve(exchange);

        StepVerifier.create(keyMono)
                .expectNext("testuser@email.com")
                .verifyComplete();
    }

}
