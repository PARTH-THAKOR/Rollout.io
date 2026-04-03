package com.rollout.io.server.sdkservice.objects;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Independent telemetry structure transmitting isolated feature interactions generated from remote clients.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SdkReport {

    @NotBlank(message = "SDK Key is required")
    private String sdkKey;

    @NotBlank(message = "Flag Key is required")
    private String flagKey;

    private Object variationValue;
    
    private String userId; 

}
