package com.rollout.io.server.controlplaneservice.objects;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GraphEdge {
    private String source; // Core Flag ID
    private String sourceKey;
    private String target; // Dependent Flag ID
    private String targetKey;
    private Object expectedValue; // Optional information
}
