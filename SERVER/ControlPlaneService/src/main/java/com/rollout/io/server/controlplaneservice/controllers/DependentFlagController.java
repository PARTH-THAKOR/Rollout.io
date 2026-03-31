package com.rollout.io.server.controlplaneservice.controllers;

import com.rollout.io.server.controlplaneservice.entity.Flag;
import com.rollout.io.server.controlplaneservice.helpers.ApiResponseBuilder;
import com.rollout.io.server.controlplaneservice.objects.ApiResponse;
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
 * REST Controller governing complex Dependent Feature Flags.
 * Dependent flags are evaluated asynchronously at runtime based on prerequisite parent rules (Core flags).
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Dependent Flag Management", description = "Endpoints for managing dependent feature flags and rule conditions")
@Validated
public class DependentFlagController {

    private final DependentFlagService dependentFlagService;

    // --- GET METHODS ---

    @GetMapping("/environments/{environmentId}/dependent-flags")
    @Operation(summary = "Get All Dependent Flags", description = "Retrieves all dependent feature flags for a specific environment.")
    public ResponseEntity<ApiResponse<List<Flag>>> getDependentFlags(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String environmentId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Dependent Flags fetched successfully", dependentFlagService.getDependentFlags(jwt, environmentId));
    }

    @GetMapping("/dependent-flags/{flagId}")
    @Operation(summary = "Get Dependent Flag", description = "Retrieves a specific dependent feature flag by its ID.")
    public ResponseEntity<ApiResponse<Flag>> getDependentFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Dependent Flag fetched successfully", dependentFlagService.getDependentFlag(jwt, flagId));
    }

    @GetMapping("/environments/{environmentId}/dependent-flags/graph")
    @Operation(summary = "Get Dependent Flags Graph", description = "Retrieves a graph response (nodes and edges) defining dependencies between flags in a specific environment.")
    public ResponseEntity<ApiResponse<com.rollout.io.server.controlplaneservice.objects.DependencyGraphResponse>> getDependentFlagsGraph(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String environmentId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Dependent flags graph fetched successfully", dependentFlagService.getDependentFlagsGraph(jwt, environmentId));
    }

    @GetMapping("/dependent-flags/by-sdk-key/evaluate/{flagKey}")
    @Operation(summary = "Evaluate Dependent Flag by SDK Key", description = "Evaluates a single dependent feature flag using the associated SDK key context.")
    public ResponseEntity<ApiResponse<com.rollout.io.server.controlplaneservice.objects.EvaluationResult>> evaluateDependentFlagBySdkKey(
            @RequestHeader("x-sdk-key") String sdkKey,
            @PathVariable String flagKey
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Dependent Flag evaluated successfully", dependentFlagService.evaluateDependentFlagBySdkKey(sdkKey, flagKey));
    }

    @GetMapping("/dependent-flags/by-sdk-key/evaluate")
    @Operation(summary = "Evaluate All Dependent Flags by SDK Key", description = "Evaluates all dependent feature flags for the environment associated with the SDK key.")
    public ResponseEntity<ApiResponse<List<com.rollout.io.server.controlplaneservice.objects.EvaluationResult>>> evaluateAllDependentFlagsBySdkKey(
            @RequestHeader("x-sdk-key") String sdkKey
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Dependent Flags evaluated successfully", dependentFlagService.evaluateAllDependentFlagsBySdkKey(sdkKey));
    }

    // --- POST METHODS ---

    @PostMapping("/environments/{environmentId}/dependent-flags")
    @Operation(summary = "Create Dependent Flag", description = "Creates a new dependent feature flag in the specified environment. Requires a valid nested RuleNode dependency definition.")
    public ResponseEntity<ApiResponse<Flag>> createDependentFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String environmentId,
            @RequestBody Flag flag
    ) {
        return ApiResponseBuilder.out(HttpStatus.CREATED, "Dependent Flag created successfully", dependentFlagService.createDependentFlag(jwt, environmentId, flag));
    }

    // --- PATCH METHODS ---

    @PatchMapping("/dependent-flags/{flagId}/toggle")
    @Operation(summary = "Toggle Dependent Flag", description = "Toggles the overall enabled status of a dependent feature flag. Note: If toggled ON, it still evaluates its dependency tree against CORE flags.")
    public ResponseEntity<ApiResponse<Flag>> toggleDependentFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Dependent Flag toggled successfully", dependentFlagService.toggleDependentFlag(jwt, flagId));
    }

    @PatchMapping("/dependent-flags/{flagId}")
    @Operation(summary = "Update Dependent Flag", description = "Updates a dependent feature flag's properties, including its nested RuleNode condition tree.")
    public ResponseEntity<ApiResponse<Flag>> updateDependentFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId,
            @RequestBody Flag flag
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Dependent Flag updated successfully", dependentFlagService.updateDependentFlag(jwt, flagId, flag));
    }

    // --- DELETE METHODS ---

    @DeleteMapping("/dependent-flags/{flagId}")
    @Operation(summary = "Delete Dependent Flag", description = "Permanently deletes a dependent feature flag.")
    public ResponseEntity<ApiResponse<Void>> deleteDependentFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId
    ) {
        dependentFlagService.deleteDependentFlag(jwt, flagId);
        return ApiResponseBuilder.out(HttpStatus.OK, "Dependent Flag deleted successfully", null);
    }

}
