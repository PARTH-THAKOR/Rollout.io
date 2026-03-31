package com.rollout.io.server.apigateway.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.hamcrest.Matchers.containsString;

/**
 * Tests the FallbackController to ensure the custom Thymeleaf 503 HTML templates
 * are served when internal microservice routes trip the circuit breaker.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
public class FallbackControllerTests {

    @Autowired
    private WebTestClient webTestClient;

    /**
     * Checks if the AuthService fallback properly returns 503 HTTP status
     * and contains the custom branded HTML string and dynamic name.
     */
    @Test
    public void testAuthFallbackRendersHtml() {
        webTestClient.get().uri("/fallback/auth")
                .exchange()
                .expectStatus().is5xxServerError()
                .expectHeader().contentTypeCompatibleWith("text/html")
                .expectBody(String.class)
                .value(containsString("Auth Service Unavailable"))
                .value(containsString("Rollout.io"));
    }

    /**
     * Checks if the Control Plane Service fallback properly returns 503 HTTP status
     * and contains the custom branded HTML string and dynamic name.
     */
    @Test
    public void testControlPlaneFallbackRendersHtml() {
        webTestClient.get().uri("/fallback/controlplane")
                .exchange()
                .expectStatus().is5xxServerError()
                .expectHeader().contentTypeCompatibleWith("text/html")
                .expectBody(String.class)
                .value(containsString("Control Plane Service Unavailable"))
                .value(containsString("Rollout.io"));
    }

}
