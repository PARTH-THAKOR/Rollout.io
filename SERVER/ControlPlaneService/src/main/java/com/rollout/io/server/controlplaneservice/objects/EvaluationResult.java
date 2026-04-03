package com.rollout.io.server.controlplaneservice.objects;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Encapsulates the execution trace and eventual evaluation mapping output of a distinct targeted feature flag.
 * Used internally for validation testing boundaries.
 */
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
