package com.rollout.io.server.apigateway.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.server.ServerWebExchange;

/**
 * Controller mapping for Resilience4J Circuit Breaker Fallbacks.
 * Returns a styled HTML page indicating 503 Service Unavailable status when internal services fail.
 */
@Controller
@RequestMapping("/fallback")
public class FallbackController {

    /**
     * Fallback for Auth Service API failures
     * @param model Thymeleaf model context
     * @param exchange The server web exchange to set response state
     * @return HTML template name 'fallback'
     */
    @GetMapping("/auth")
    public String authFallback(Model model, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
        model.addAttribute("serviceName", "Auth");
        return "fallback";
    }

    /**
     * Fallback for Control Plane Service API failures
     * @param model Thymeleaf model context
     * @param exchange The server web exchange to set response state
     * @return HTML template name 'fallback'
     */
    @GetMapping("/controlplane")
    public String controlPlaneFallback(Model model, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
        model.addAttribute("serviceName", "Control Plane");
        return "fallback";
    }

    /**
     * Fallback for SDK Service API failures
     * @param model Thymeleaf model context
     * @param exchange The server web exchange to set response state
     * @return HTML template name 'fallback'
     */
    @GetMapping("/sdk")
    public String sdkFallback(Model model, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
        model.addAttribute("serviceName", "SDK");
        return "fallback";
    }

}
