package com.rollout.io.server.controlplaneservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Main application class for the Control Plane Service.
 * This service handles administrative management of Projects, Environments,
 * Feature Flags, and Dependency Graphs within the Rollout.io platform.
 * Licensed under the MIT License.
 *
 * @author Parthsinh Thakor
 */
@EnableAsync
@EnableDiscoveryClient
@SpringBootApplication
public class ControlPlaneServiceApplication {

    /**
     * Entry point for the Control Plane Service application.
     *
     * @param args Command-line arguments passed during startup
     */
    public static void main(String[] args) {
        SpringApplication.run(ControlPlaneServiceApplication.class, args);
    }

}
