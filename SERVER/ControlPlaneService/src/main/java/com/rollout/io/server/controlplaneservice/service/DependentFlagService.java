package com.rollout.io.server.controlplaneservice.service;

import com.rollout.io.server.controlplaneservice.entity.Flag;
import com.rollout.io.server.controlplaneservice.objects.DependencyGraphResponse;
import com.rollout.io.server.controlplaneservice.objects.EvaluationResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service interface outlining the business logic for managing Dependent Feature Flags.
 * Handles complex rules, dynamic targeting constraints, graph evaluations, and runtime resolving.
 */
@Service
public interface DependentFlagService {

    /**
     * Provisions a complex logical dependency flag with hierarchical rule mappings.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId the mapped target namespace where the flag resides
     * @param flag raw model containing dependencies correctly built
     * @return completely validated topological dependent node saved to DB
     */
    Flag createDependentFlag(Jwt jwt, String environmentId, Flag flag);

    /**
     * Gathers every existing dependency categorized feature flag under the given environment.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId boundary constraint mapping query namespace
     * @return fully mapped collection containing complex tree flags
     */
    List<Flag> getDependentFlags(Jwt jwt, String environmentId);

    /**
     * Resolves exactly one dependent flag checking standard authorization ownership traces.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId distinct object identifier sequence
     * @return explicitly fetched instance mapping topological properties
     */
    Flag getDependentFlag(Jwt jwt, String flagId);

    /**
     * Applies delta payload configuration modifying constraints or dependency edges for a dependent flag.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId explicitly targeted topological feature element
     * @param flag configuration blueprint containing delta updates
     * @return resulting object precisely stored successfully inside Mongo
     */
    Flag updateDependentFlag(Jwt jwt, String flagId, Flag flag);

    /**
     * Systematically drops a mapped dependent flag configuration.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId unique document mapping identifying deletion target
     */
    void deleteDependentFlag(Jwt jwt, String flagId);

    /**
     * Overrides internal boolean constraint flags governing operational viability.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param flagId precise document locator parameter
     * @return structurally preserved flag returned with newly toggled baseline configuration
     */
    Flag toggleDependentFlag(Jwt jwt, String flagId);

    /**
     * Executes real-time complex dependency computation parsing runtime rules for an explicit dependent flag.
     *
     * @param sdkKey exact securely generated cryptographic execution identification boundary
     * @param flagKey human visible application reference identifier mapped natively
     * @return single explicitly modeled execution trace confirming boolean resolution paths
     */
    EvaluationResult evaluateDependentFlagBySdkKey(String sdkKey, String flagKey);

    /**
     * Mass processes computations evaluating every mapped topology node against present system states.
     *
     * @param sdkKey operational authentication bearer token fragment isolating environment queries
     * @return combined list representing complete Boolean matrices for active rules
     */
    List<EvaluationResult> evaluateAllDependentFlagsBySdkKey(String sdkKey);

    /**
     * Constructs the visual node/edge schema mapping all dependencies correctly structured.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param environmentId active environment namespace mapping rules
     * @return topological layout structure designed for React Flow format parsing directly
     */
    DependencyGraphResponse getDependentFlagsGraph(Jwt jwt, String environmentId);

}
