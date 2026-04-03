package com.rollout.io.server.controlplaneservice.objects;

import lombok.Builder;
import lombok.Data;

/**
 * Represents a directional connective edge mapping rule dependencies to upstream core flags.
 * Utilized explicitly for visualizing JSON output structures mapping graph topologies.
 */
@Data
@Builder
public class GraphEdge {

    private String source;
    private String sourceKey;
    private String target;
    private String targetKey;
    private Object expectedValue;

}
