package com.rollout.io.server.controlplaneservice.objects;

import com.rollout.io.server.controlplaneservice.entity.FlagCategory;
import lombok.Builder;
import lombok.Data;

/**
 * Independent mapped representation of a single feature flag inside a complex dependency web.
 * Striped down topological entity intended for UI graph renderers.
 */
@Data
@Builder
public class GraphNode {

    private String id;
    private String key;
    private String label;
    private FlagCategory category;
    private String type;
    private Boolean enabled;

}
