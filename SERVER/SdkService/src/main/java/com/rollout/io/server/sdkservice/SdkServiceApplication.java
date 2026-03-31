package com.rollout.io.server.sdkservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application class for the SDK Service.
 * This service provides high-performance, real-time feature flag evaluation
 * for connected client SDKs with Redis-backed caching and background sync.
 * Licensed under the MIT License.
 *
 * @author Parthsinh Thakor
 */
@EnableDiscoveryClient
@EnableScheduling
@SpringBootApplication
public class SdkServiceApplication {

    /**
     * Entry point for the SDK Service application.
     *
     * @param args Command-line arguments passed during startup
     */
    public static void main(String[] args) {
        SpringApplication.run(SdkServiceApplication.class, args);
    }

}
