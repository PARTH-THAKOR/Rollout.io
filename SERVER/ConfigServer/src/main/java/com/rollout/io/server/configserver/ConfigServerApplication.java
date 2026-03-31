package com.rollout.io.server.configserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

/**
 * Main application class for the Config Server.
 * This service centralizes external configuration management across all microservices.
 * Licensed under the MIT License.
 *
 * @author Parthsinh Thakor
 */
@EnableConfigServer
@SpringBootApplication
public class ConfigServerApplication {

    /**
     * Entry point for the Config Server application.
     *
     * @param args Command-line arguments passed during startup
     */
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }

}
