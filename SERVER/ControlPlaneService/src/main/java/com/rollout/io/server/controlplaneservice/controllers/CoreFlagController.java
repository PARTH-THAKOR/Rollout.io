package com.rollout.io.server.controlplaneservice.controllers;

import com.rollout.io.server.controlplaneservice.entity.Flag;
import com.rollout.io.server.controlplaneservice.helpers.ApiResponseBuilder;
import com.rollout.io.server.controlplaneservice.objects.ApiResponse;
import com.rollout.io.server.controlplaneservice.service.CoreFlagService;
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
 * REST Controller governing fundamental independent Core Feature Flags.
 * Core flags act as standalone base variables (boolean, text, strictly structured JSON) evaluated directly.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Core Flag Management", description = "Endpoints for managing core feature flags")
@Validated
public class CoreFlagController {

    private final CoreFlagService coreFlagService;

    // --- GET METHODS ---

    @GetMapping("/environments/{environmentId}/core-flags")
    @Operation(summary = "Get All Core Flags", description = "Retrieves all core feature flags for a specific environment.")
    public ResponseEntity<ApiResponse<List<Flag>>> getCoreFlags(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String environmentId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Core Flags fetched successfully", coreFlagService.getCoreFlags(jwt, environmentId));
    }

    @GetMapping("/environments/{environmentId}/core-flags/basic")
    @Operation(summary = "Get Basic Core Flags", description = "Retrieves all basic (non-JSON) core feature flags for a specific environment.")
    public ResponseEntity<ApiResponse<List<Flag>>> getBasicCoreFlags(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String environmentId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Basic Core Flags fetched successfully", coreFlagService.getBasicCoreFlags(jwt, environmentId));
    }

    @GetMapping("/environments/{environmentId}/core-flags/json")
    @Operation(summary = "Get JSON Core Flags", description = "Retrieves all JSON core feature flags for a specific environment.")
    public ResponseEntity<ApiResponse<List<Flag>>> getJsonCoreFlags(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String environmentId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "JSON Core Flags fetched successfully", coreFlagService.getJsonCoreFlags(jwt, environmentId));
    }

    @GetMapping("/core-flags/by-sdk-key") // Public-facing endpoint for SDKs
    @Operation(summary = "Get Core Flags by SDK Key", description = "Retrieves all core feature flags for the environment associated with the SDK key. No user authentication required.")
    public ResponseEntity<ApiResponse<List<Flag>>> getCoreFlagsBySdkKey(
            @RequestHeader("x-sdk-key") String sdkKey
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Core Flags fetched successfully", coreFlagService.getCoreFlagsBySdkKey(sdkKey));
    }

    @GetMapping("/core-flags/{flagId}")
    @Operation(summary = "Get Core Flag", description = "Retrieves a specific core feature flag by its ID.")
    public ResponseEntity<ApiResponse<Flag>> getCoreFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Core Flag fetched successfully", coreFlagService.getCoreFlag(jwt, flagId));
    }

    // --- POST METHODS ---

    @PostMapping("/environments/{environmentId}/core-flags")
    @Operation(summary = "Create Core Flag", description = "Creates a new core feature flag in the specified environment.")
    public ResponseEntity<ApiResponse<Flag>> createCoreFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String environmentId,
            @RequestBody Flag flag
    ) {
        return ApiResponseBuilder.out(HttpStatus.CREATED, "Core Flag created successfully", coreFlagService.createCoreFlag(jwt, environmentId, flag));
    }

    // --- PATCH METHODS ---

    @PatchMapping("/core-flags/{flagId}/toggle")
    @Operation(summary = "Toggle Core Flag", description = "Toggles the enabled status of a core feature flag.")
    public ResponseEntity<ApiResponse<Flag>> toggleCoreFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Core Flag toggled successfully", coreFlagService.toggleCoreFlag(jwt, flagId));
    }

    @PatchMapping("/core-flags/{flagId}")
    @Operation(summary = "Update Core Flag", description = "Updates a core feature flag's properties (value, description, etc.).")
    public ResponseEntity<ApiResponse<Flag>> updateCoreFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId,
            @RequestBody Flag flag
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Core Flag updated successfully", coreFlagService.updateCoreFlag(jwt, flagId, flag));
    }

    // --- DELETE METHODS ---

    @DeleteMapping("/core-flags/{flagId}")
    @Operation(summary = "Delete Core Flag", description = "Permanently deletes a core feature flag.")
    public ResponseEntity<ApiResponse<Void>> deleteCoreFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId
    ) {
        coreFlagService.deleteCoreFlag(jwt, flagId);
        return ApiResponseBuilder.out(HttpStatus.OK, "Core Flag deleted successfully", null);
    }

}
