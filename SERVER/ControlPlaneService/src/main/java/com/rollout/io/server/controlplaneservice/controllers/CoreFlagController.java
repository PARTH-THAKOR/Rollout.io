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
 * REST controller for managing standalone Core feature flags.
 * Core flags represent independent boolean, string, or JSON-based toggle variables.
 */
@RestController
@RequestMapping("/apiControl/v1")
@RequiredArgsConstructor
@Tag(name = "Core Flag Management", description = "Endpoints for administering independent feature flags")
@Validated
public class CoreFlagController {

    private final CoreFlagService coreFlagService;

    /**
     * Retrieves all core flags associated with a specific environment.
     *
     * @param jwt           the authenticated principal
     * @param environmentId the ID of the environment scope
     * @return a collection of core flags
     */
    @GetMapping("/environments/{environmentId}/core-flags")
    @Operation(summary = "Get All Core Flags", description = "Retrieves the complete list of core flags for a specific environment.")
    public ResponseEntity<ApiResponse<List<Flag>>> getCoreFlags(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String environmentId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Core flags retrieved successfully", coreFlagService.getCoreFlags(jwt, environmentId));
    }

    /**
     * Filters for basic (non-JSON) core flags within an environment.
     *
     * @param jwt           the authenticated principal
     * @param environmentId the ID of the environment scope
     * @return a collection of boolean and string core flags
     */
    @GetMapping("/environments/{environmentId}/core-flags/basic")
    @Operation(summary = "Get Basic Core Flags", description = "Retrieves only the boolean and string-based flags for an environment.")
    public ResponseEntity<ApiResponse<List<Flag>>> getBasicCoreFlags(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String environmentId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Basic core flags retrieved successfully", coreFlagService.getBasicCoreFlags(jwt, environmentId));
    }

    /**
     * Filters for strictly JSON-based core flags within an environment.
     *
     * @param jwt           the authenticated principal
     * @param environmentId the ID of the environment scope
     * @return a collection of structured configuration flags
     */
    @GetMapping("/environments/{environmentId}/core-flags/json")
    @Operation(summary = "Get JSON Core Flags", description = "Retrieves only the configured JSON-type flags for an environment.")
    public ResponseEntity<ApiResponse<List<Flag>>> getJsonCoreFlags(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String environmentId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "JSON core flags retrieved successfully", coreFlagService.getJsonCoreFlags(jwt, environmentId));
    }

    /**
     * Public-accessible endpoint for SDKs to fetch flags using an environment-specific SDK Key.
     *
     * @param sdkKey the platform-generated SDK key from headers
     * @return a list of flags for the resolved environment
     */
    @GetMapping("/core-flags/by-sdk-key")
    @Operation(summary = "Get Core Flags by SDK Key", description = "Retrieves flags for an environment using its SDK Key. No user JWT required.")
    public ResponseEntity<ApiResponse<List<Flag>>> getCoreFlagsBySdkKey(
            @RequestHeader("x-sdk-key") String sdkKey
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Core flags resolved successfully", coreFlagService.getCoreFlagsBySdkKey(sdkKey));
    }

    /**
     * Fetches a single core flag by its unique document ID.
     *
     * @param jwt    the authenticated principal
     * @param flagId the ID of the target flag
     * @return the flag details
     */
    @GetMapping("/core-flags/{flagId}")
    @Operation(summary = "Get Core Flag", description = "Retrieves a specific core flag using its unique system ID.")
    public ResponseEntity<ApiResponse<Flag>> getCoreFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Core flag retrieved successfully", coreFlagService.getCoreFlag(jwt, flagId));
    }

    /**
     * Initializes a new core flag in the specified environment.
     *
     * @param jwt           the authenticated principal
     * @param environmentId the target environment scope
     * @param flag          the flag configuration to persist
     * @return the saved flag document
     */
    @PostMapping("/environments/{environmentId}/core-flags")
    @Operation(summary = "Create Core Flag", description = "Registers a new core flag within a specific environment.")
    public ResponseEntity<ApiResponse<Flag>> createCoreFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String environmentId,
            @RequestBody Flag flag
    ) {
        return ApiResponseBuilder.out(HttpStatus.CREATED, "Core flag initialized successfully", coreFlagService.createCoreFlag(jwt, environmentId, flag));
    }

    /**
     * Toggles the active/inactive state of a core flag.
     *
     * @param jwt    the authenticated principal
     * @param flagId the ID of the flag to toggle
     * @return the updated flag document
     */
    @PatchMapping("/core-flags/{flagId}/toggle")
    @Operation(summary = "Toggle Core Flag", description = "Toggles the operational status of an existing core flag.")
    public ResponseEntity<ApiResponse<Flag>> toggleCoreFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Core flag state toggled successfully", coreFlagService.toggleCoreFlag(jwt, flagId));
    }

    /**
     * Updates individual properties of an existing core flag.
     *
     * @param jwt    the authenticated principal
     * @param flagId the ID of the flag to update
     * @param flag   the updated configuration fields
     * @return the updated flag document
     */
    @PatchMapping("/core-flags/{flagId}")
    @Operation(summary = "Update Core Flag", description = "Updates specific metadata or default values of an existing core flag.")
    public ResponseEntity<ApiResponse<Flag>> updateCoreFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId,
            @RequestBody Flag flag
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Core flag updated successfully", coreFlagService.updateCoreFlag(jwt, flagId, flag));
    }

    /**
     * Permanently removes a core flag from the environment.
     *
     * @param jwt    the authenticated principal
     * @param flagId the ID of the flag to remove
     * @return a success response wrapper
     */
    @DeleteMapping("/core-flags/{flagId}")
    @Operation(summary = "Delete Core Flag", description = "Permanently removes a core flag and its associated metadata.")
    public ResponseEntity<ApiResponse<Void>> deleteCoreFlag(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String flagId
    ) {
        coreFlagService.deleteCoreFlag(jwt, flagId);
        return ApiResponseBuilder.out(HttpStatus.OK, "Core flag terminated successfully", null);
    }

}
