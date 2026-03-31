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
public class TargetingRule {

    private String attribute;

    private TargetOperator operator;

    private Object value;

    private List<Object> values;
}
