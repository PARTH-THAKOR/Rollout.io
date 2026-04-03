package com.rollout.io.server.controlplaneservice.objects;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Data Transfer Object encapsulating an entire configured dependency topology.
 * Serves mapped edge and node constraints to visually represent the prerequisite structure on the frontend.
 */
@Data
@Builder
public class DependencyGraphResponse {

    private List<GraphNode> nodes;
    private List<GraphEdge> edges;

}
