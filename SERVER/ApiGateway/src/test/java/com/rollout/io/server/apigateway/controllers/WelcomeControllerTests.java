package com.rollout.io.server.apigateway.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.hamcrest.Matchers.containsString;

/**
 * Tests the WelcomeController mapping and public web access
 * verifying basic navigation and routing index pages over WebFlux.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
public class WelcomeControllerTests {

    @Autowired
    private WebTestClient webTestClient;

    /**
     * Checks if the home route "/" loads correctly and serves the HTML index page content.
     */
    @Test
    public void testHomeRouteLoadsIndexHtml() {
        webTestClient.get().uri("/")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().contentTypeCompatibleWith("text/html")
                .expectBody(String.class)
                .value(containsString("Rollout.io"));
    }

    /**
     * Confirms that posting to "/login" correctly returns a generic redirect to the Swagger UI page.
     */
    @Test
    public void testLoginRedirectsToSwagger() {
        webTestClient.post().uri("/login")
                .exchange()
                .expectStatus().is3xxRedirection()
                .expectHeader().valueEquals("Location", "/webjars/swagger-ui/index.html");
    }

}
