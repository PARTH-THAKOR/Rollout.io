package com.rollout.io.server.controlplaneservice.service;

import com.rollout.io.server.controlplaneservice.entity.Flag;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

/**
 * Service interface outlining the business logic for managing Dependent Feature Flags.
 * Handles complex rules, dynamic targeting constraints, graph evaluations, and runtime resolving.
 */
public interface DependentFlagService {

    Flag createDependentFlag(Jwt jwt, String environmentId, Flag flag);

    List<Flag> getDependentFlags(Jwt jwt, String environmentId);

    Flag getDependentFlag(Jwt jwt, String flagId);

    Flag updateDependentFlag(Jwt jwt, String flagId, Flag flag);

    void deleteDependentFlag(Jwt jwt, String flagId);

    Flag toggleDependentFlag(Jwt jwt, String flagId);

    com.rollout.io.server.controlplaneservice.objects.EvaluationResult evaluateDependentFlagBySdkKey(String sdkKey, String flagKey);

    List<com.rollout.io.server.controlplaneservice.objects.EvaluationResult> evaluateAllDependentFlagsBySdkKey(String sdkKey);

    com.rollout.io.server.controlplaneservice.objects.DependencyGraphResponse getDependentFlagsGraph(Jwt jwt, String environmentId);

}
