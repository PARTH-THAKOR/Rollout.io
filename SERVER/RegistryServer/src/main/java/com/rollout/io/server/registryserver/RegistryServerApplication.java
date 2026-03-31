package com.rollout.io.server.registryserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * Main application class for the Registry Server.
 * This service acts as a service discovery registry (Eureka Server) for all microservices in the Rollout.io platform.
 * Licensed under the MIT License.
 *
 * @author Parthsinh Thakor
 */
@EnableEurekaServer
@SpringBootApplication
public class RegistryServerApplication {

    /**
     * Entry point for the Registry Server application.
     *
     * @param args Command-line arguments passed during startup
     */
    public static void main(String[] args) {
        SpringApplication.run(RegistryServerApplication.class, args);
    }

}
