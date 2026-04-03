package com.rollout.io.server.sdkservice.entity;

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

    private String attribute;

    private TargetOperator operator;

    private Object value;

    private List<Object> values;

}
