package com.rollout.io.server.sdkservice.objects;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import java.util.Map;

import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SdkProxyResponse {
    @JsonProperty("env")
    private String environmentKey;
    private Integer version;
    private Map<String, Object> flags;
}
