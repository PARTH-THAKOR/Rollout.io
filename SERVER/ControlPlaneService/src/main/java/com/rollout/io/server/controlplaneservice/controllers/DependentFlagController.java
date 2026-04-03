package com.rollout.io.server.controlplaneservice.controllers;

import com.rollout.io.server.controlplaneservice.entity.Flag;
import com.rollout.io.server.controlplaneservice.helpers.ApiResponseBuilder;
import com.rollout.io.server.controlplaneservice.objects.ApiResponse;
import com.rollout.io.server.controlplaneservice.objects.DependencyGraphResponse;
import com.rollout.io.server.controlplaneservice.objects.EvaluationResult;
import com.rollout.io.server.controlplaneservice.service.DependentFlagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing complex Dependent feature flags.
 * Dependent flags are conditionally evaluated at runtime based on prerequisite Core flag states.
 */
@RestController
@RequestMapping("/apiControl/v1")
@RequiredArgsConstructor
@Tag(name = "Dependent Flag Management", description = "Endpoints for administering rule-based conditional flags")
@Validated
public class DependentFlagController {

    private final DependentFlagService dependentFlagService;

    /**
     * Lists all dependent flags within a specific environment scope.
     *
     * @param jwt           the authenticated principal
     * @param environmentId the ID of the environment
     * @return a collection of dependent flags
     */
    @GetMapping("/environments/{environmentId}/dependent-flags")
    @Operation(summary = "Get All Dependent Flags", description = "Retrieves the complete list of dependent flags for a specific environment.")
    public ResponseEntity<ApiResponse<List<Flag>>> getDependentFlags(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String environmentId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Dependent flags retrieved successfully", dependentFlagService.getDependentFlags(jwt, environmentId));
    }

    /**
     * Retrieves a single dependent flag document by its unique identifier.
     *
     * @param jwt    the authenticated principal
     * @param flagId the ID of the target flag
     * @return the flag details
     */
    @GetMapping("/dependent-flags/{flagId}")
    @Operation(summary = "Get Dependent Flag", description = "Retrieves a specific dependent flag using its unique system ID.")
    public ResponseEntity<ApiResponse<Flag>> getDependentFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Dependent flag retrieved successfully", dependentFlagService.getDependentFlag(jwt, flagId));
    }

    /**
     * Generates a visualization-ready graph of flag dependencies within an environment.
     *
     * @param jwt           the authenticated principal
     * @param environmentId the ID of the environment
     * @return a graph containing nodes (flags) and edges (dependencies)
     */
    @GetMapping("/environments/{environmentId}/dependent-flags/graph")
    @Operation(summary = "Get Dependent Flags Graph", description = "Generates a comprehensive dependency graph (nodes and edges) for the environment.")
    public ResponseEntity<ApiResponse<DependencyGraphResponse>> getDependentFlagsGraph(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String environmentId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Dependency graph generated successfully", dependentFlagService.getDependentFlagsGraph(jwt, environmentId));
    }

    /**
     * Evaluates a single dependent flag using its mnemonic key for the provided SDK context.
     *
     * @param sdkKey  the platform SDK key
     * @param flagKey the logical key of the flag
     * @return the evaluation result (state and value)
     */
    @GetMapping("/dependent-flags/by-sdk-key/evaluate/{flagKey}")
    @Operation(summary = "Evaluate Dependent Flag", description = "Evaluates the runtime state of a single flag using SDK-Key scoped context.")
    public ResponseEntity<ApiResponse<EvaluationResult>> evaluateDependentFlagBySdkKey(
            @RequestHeader("x-sdk-key") String sdkKey,
            @PathVariable String flagKey
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Evaluation completed successfully", dependentFlagService.evaluateDependentFlagBySdkKey(sdkKey, flagKey));
    }

    /**
     * Evaluates the entire suite of dependent flags for the provided SDK context.
     *
     * @param sdkKey the platform SDK key
     * @return a list of evaluation results for all flags in the environment
     */
    @GetMapping("/dependent-flags/by-sdk-key/evaluate")
    @Operation(summary = "Evaluate All Dependent Flags", description = "Evaluates all platform flags for the environment associated with the SDK Key.")
    public ResponseEntity<ApiResponse<List<EvaluationResult>>> evaluateAllDependentFlagsBySdkKey(
            @RequestHeader("x-sdk-key") String sdkKey
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Bulk evaluation completed successfully", dependentFlagService.evaluateAllDependentFlagsBySdkKey(sdkKey));
    }

    /**
     * Initializes a new dependent flag with its conditional rule tree.
     *
     * @param jwt           the authenticated principal
     * @param environmentId the target environment scope
     * @param flag          the flag configuration with RuleNodes
     * @return the saved flag document
     */
    @PostMapping("/environments/{environmentId}/dependent-flags")
    @Operation(summary = "Create Dependent Flag", description = "Registers a new dependent flag with a defined nested condition tree.")
    public ResponseEntity<ApiResponse<Flag>> createDependentFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String environmentId,
            @RequestBody Flag flag
    ) {
        return ApiResponseBuilder.out(HttpStatus.CREATED, "Dependent flag initialized successfully", dependentFlagService.createDependentFlag(jwt, environmentId, flag));
    }

    /**
     * Toggles the operational state of a dependent flag.
     *
     * @param jwt    the authenticated principal
     * @param flagId the ID of the flag to toggle
     * @return the updated flag document
     */
    @PatchMapping("/dependent-flags/{flagId}/toggle")
    @Operation(summary = "Toggle Dependent Flag", description = "Toggles the primary operational status of an existing dependent flag.")
    public ResponseEntity<ApiResponse<Flag>> toggleDependentFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Dependent flag state toggled successfully", dependentFlagService.toggleDependentFlag(jwt, flagId));
    }

    /**
     * Updates descriptive metadata or rule definitions for an existing dependent flag.
     *
     * @param jwt    the authenticated principal
     * @param flagId the ID of the flag to update
     * @param flag   the updated configuration fields
     * @return the updated flag document
     */
    @PatchMapping("/dependent-flags/{flagId}")
    @Operation(summary = "Update Dependent Flag", description = "Updates specific metadata or complex condition rules for an existing dependent flag.")
    public ResponseEntity<ApiResponse<Flag>> updateDependentFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId,
            @RequestBody Flag flag
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Dependent flag updated successfully", dependentFlagService.updateDependentFlag(jwt, flagId, flag));
    }

    /**
     * Permanently removes a dependent flag from the platform.
     *
     * @param jwt    the authenticated principal
     * @param flagId the ID of the flag to remove
     * @return a success response wrapper
     */
    @DeleteMapping("/dependent-flags/{flagId}")
    @Operation(summary = "Delete Dependent Flag", description = "Permanently removes a dependent flag and its associated condition logic.")
    public ResponseEntity<ApiResponse<Void>> deleteDependentFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId
    ) {
        dependentFlagService.deleteDependentFlag(jwt, flagId);
        return ApiResponseBuilder.out(HttpStatus.OK, "Dependent flag terminated successfully", null);
    }

}
