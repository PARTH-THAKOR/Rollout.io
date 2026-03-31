package com.rollout.io.server.apigateway.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

/**
 * Controller mapping for the public facing base entry-points of the API Gateway.
 * Returns HTML index templates or redirects to Swagger UI for external explorers.
 */
@Controller
public class WelcomeController {

    /**
     * Renders the branded Space-themed Landing/Index HTML page.
     *
     * @return HTML template name 'index'
     */
    @GetMapping("/")
    public String home() {
        return "index";
    }

    /**
     * Handles dummy POST login requests from the Swagger UI workflow.
     * Instead of intercepting it via Spring Security, redirects the client
     * back to the Swagger portal where they can map the actual Token.
     *
     * @return HTTP redirect instructing browser to reload Swagger-UI web-jar
     */
    @PostMapping("/login")
    public String redirectToSwagger() {
        return "redirect:/webjars/swagger-ui/index.html";
    }

}
