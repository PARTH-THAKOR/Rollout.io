package com.rollout.io.server.controlplaneservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * A single targeting rule.
 * Example: { attribute: "country", operator: EQUALS, value: "IN" }
 * Example: { attribute: "device", operator: IN, values: ["android", "ios"] }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TargetingRule {

    private String attribute;         // e.g. "country", "device", "plan"

    private TargetOperator operator;  // EQUALS, IN, CONTAINS, GT, etc.

    private Object value;             // single value (for EQUALS, NOT_EQUALS, CONTAINS, GT, etc.)

    private List<Object> values;      // multi-value (for IN, NOT_IN operators)
}
