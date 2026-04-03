package com.rollout.io.server.sdkservice.objects;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Configuration payload structured for initializing an external runtime SDK Client.
 * Carries the primary validation tokens alongside custom mapped identifiers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SdkConfig {

    @NotBlank(message = "SDK Key is required")
    private String sdkKey;

    @NotBlank(message = "User ID is required")
    private String userId;

    private String platform;

    private Map<String, Object> attributes;

    private String baseUrl;

    private Integer refreshInterval;

}
