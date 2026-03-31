package com.rollout.io.server.controlplaneservice.objects;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationResult {
    private String flagKey;
    private boolean isEnabled;
    private boolean ruleMatched;
    private boolean finalResult;
    private Object flagValue;
}
