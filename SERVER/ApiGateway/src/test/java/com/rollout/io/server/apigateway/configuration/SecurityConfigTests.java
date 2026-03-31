package com.rollout.io.server.apigateway.configuration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

/**
 * Test class for validating WebFlux Security configuration limits, accessible public paths
 * and token requirements for internal requests mapped by ApiGateway.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
public class SecurityConfigTests {

    @Autowired
    private WebTestClient webTestClient;

    /**
     * Checks if the Actuator Health endpoint is publicly available without Auth.
     */
    @Test
    public void testPublicActuatorHealthEndpoint() {
        webTestClient.get().uri("/actuator/health")
                .exchange()
                .expectStatus().isOk();
    }

    /**
     * Checks if the Actuator Prometheus endpoint is publicly available without Auth.
     */
    @Test
    public void testPublicActuatorPrometheusEndpoint() {
        webTestClient.get().uri("/actuator/prometheus")
                .exchange()
                .expectStatus().isOk();
    }

    /**
     * Validates that access to an arbitrary protected backend route throws customized JSON unauthorized error.
     */
    @Test
    public void testProtectedBackendRouteRequiresAuth() {
        webTestClient.get().uri("/authservice/users/me")
                .exchange()
                .expectStatus().isUnauthorized()
                .expectHeader().contentType(MediaType.APPLICATION_JSON)
                .expectBody()
                .jsonPath("$.success").isEqualTo(false)
                .jsonPath("$.message").isEqualTo("ACCESS DENIED [AUTHENTICATION REQUIRED]");
    }

    /**
     * Validates that accessing root "/" renders correctly as a permit_all fallback page.
     */
    @Test
    public void testRootEndpointIsPermitted() {
        webTestClient.get().uri("/")
                .exchange()
                .expectStatus().isOk();
    }

}
