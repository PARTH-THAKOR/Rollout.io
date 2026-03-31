package com.rollout.io.server.controlplaneservice.objects;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DependencyGraphResponse {
    private List<GraphNode> nodes;
    private List<GraphEdge> edges;
}
