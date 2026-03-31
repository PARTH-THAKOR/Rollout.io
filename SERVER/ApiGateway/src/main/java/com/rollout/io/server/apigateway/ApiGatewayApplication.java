package com.rollout.io.server.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * Main application class for the API Gateway.
 * This service acts as the single entry point, routing requests to appropriate backend microservices.
 * Licensed under the MIT License.
 *
 * @author Parthsinh Thakor
 */
@EnableDiscoveryClient
@SpringBootApplication
public class ApiGatewayApplication {

    /**
     * Entry point for the API Gateway application.
     *
     * @param args Command-line arguments passed during startup
     */
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

}
