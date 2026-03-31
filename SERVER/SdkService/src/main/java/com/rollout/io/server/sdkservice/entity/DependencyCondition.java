package com.rollout.io.server.sdkservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DependencyCondition {

    private String flagId;

    private Object expectedValue;
}
