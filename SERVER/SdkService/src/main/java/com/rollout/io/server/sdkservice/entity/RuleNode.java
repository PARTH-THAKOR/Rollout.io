package com.rollout.io.server.sdkservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Represents a vertex within the prerequisite rule dependency graph.
 * Nodes resolve structurally into either logical combiners (AND/OR operators applying to children)
 * or concrete prerequisite evaluations (strict dependencies on another target flag state).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RuleNode {

    private LogicalOperator operator;

    private List<RuleNode> children;

    private DependencyCondition condition;

}
