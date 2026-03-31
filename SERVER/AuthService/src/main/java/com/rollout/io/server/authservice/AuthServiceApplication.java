package com.rollout.io.server.authservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * Main application class for the Auth Service.
 * This service handles developer identities and profile synchronization with Firebase
 * within the Rollout.io platform.
 * Licensed under the MIT License.
 *
 * @author Parthsinh Thakor
 */
@EnableDiscoveryClient
@SpringBootApplication
public class AuthServiceApplication {

    /**
     * Entry point for the Auth Service application.
     *
     * @param args Command-line arguments passed during startup
     */
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }

}
