package com.rollout.io.server.sdkservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Defines a literal prerequisite evaluation enforcing that an upstream
 * core flag must match the exact expected value to successfully fulfill the dependency rule path.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DependencyCondition {

    private String flagId;

    private Object expectedValue;

}
