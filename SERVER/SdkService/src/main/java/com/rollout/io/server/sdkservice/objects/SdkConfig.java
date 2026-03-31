package com.rollout.io.server.sdkservice.objects;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SdkConfig {

    @NotBlank(message = "SDK Key is required")
    private String sdkKey;

    @NotBlank(message = "User ID is required")
    private String userId;

    // Future: user attributes for targeted rollout (e.g. country, plan, etc.)
    private Map<String, Object> attributes;

    // Optional: SDK can override base URL
    private String baseUrl;

    // Optional: polling interval in seconds (default handled by SDK client)
    private Integer refreshInterval;
}
