package com.rollout.io.server.sdkservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RuleNode {

    private LogicalOperator operator; 
    // If this is a group node (AND/OR)

    private List<RuleNode> children;
    // Nested rule groups

    private DependencyCondition condition; 
    // If this is a leaf node
}
