package com.rollout.io.server.controlplaneservice.objects;

import com.rollout.io.server.controlplaneservice.entity.FlagCategory;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GraphNode {
    private String id;
    private String key;
    private String label;
    private FlagCategory category;
    private String type; // STRING, BOOLEAN etc.
    private Boolean enabled;
}
