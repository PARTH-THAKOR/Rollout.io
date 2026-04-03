package com.rollout.io.server.controlplaneservice.controllers;

import com.rollout.io.server.controlplaneservice.entity.Environment;
import com.rollout.io.server.controlplaneservice.helpers.ApiResponseBuilder;
import com.rollout.io.server.controlplaneservice.objects.ApiResponse;
import com.rollout.io.server.controlplaneservice.service.EnvironmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing logical environments scoped under projects.
 * Handles environment lifecycle, SDK key rotations, and project-based isolation.
 */
@RestController
@RequestMapping("/apiControl/v1")
@RequiredArgsConstructor
@Tag(name = "Environment Management", description = "Endpoints for managing environment lifecycle within project scopes")
@Validated
public class EnvironmentController {

    private final EnvironmentService environmentService;

    /**
     * Lists all environments associated with a specific project.
     *
     * @param jwt       the authenticated principal
     * @param projectId the ID of the parent project
     * @return a list of associated environments
     */
    @GetMapping("/projects/{projectId}/environments")
    @Operation(summary = "Get Environments by Project", description = "Retrieves all environments belonging to the specified project.")
    public ResponseEntity<ApiResponse<List<Environment>>> getEnvironmentsByProject(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String projectId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Environments retrieved successfully", environmentService.getEnvironmentsByProjectId(jwt, projectId));
    }

    /**
     * Retrieves a specific environment using its unique identifier.
     *
     * @param jwt           the authenticated principal
     * @param environmentId the ID of the target environment
     * @return the environment details
     */
    @GetMapping("/environments/{environmentId}")
    @Operation(summary = "Get Environment by ID", description = "Retrieves a specific environment by its unique ID.")
    public ResponseEntity<ApiResponse<Environment>> getEnvironment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String environmentId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Environment retrieved successfully", environmentService.getEnvironmentById(jwt, environmentId));
    }

    /**
     * Locates an environment scoped by a valid SDK key.
     *
     * @param sdkKey the platform-generated SDK key from headers
     * @return the resolved environment document
     */
    @GetMapping("/environments/by-sdk-key")
    @Operation(summary = "Get Environment by SDK Key", description = "Retrieves an environment using its associated SDK Key.")
    public ResponseEntity<ApiResponse<Environment>> getEnvironmentBySdkKey(
            @RequestHeader("x-sdk-key") @NotBlank String sdkKey
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Environment resolved successfully", environmentService.getEnvironmentBySdkKey(sdkKey));
    }

    /**
     * Initializes a new environment within the specified project scope.
     *
     * @param jwt         the authenticated principal
     * @param projectId   the ID of the parent project
     * @param environment the environment configuration to persist
     * @return the saved environment document
     */
    @PostMapping("/projects/{projectId}/environments")
    @Operation(summary = "Create Environment", description = "Creates a new environment isolated within a specific project.")
    public ResponseEntity<ApiResponse<Environment>> createEnvironment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String projectId,
            @RequestBody Environment environment
    ) {
        return ApiResponseBuilder.out(HttpStatus.CREATED, "Environment initialized successfully", environmentService.createEnvironment(jwt, projectId, environment));
    }

    /**
     * Updates the logical display name of an existing environment.
     *
     * @param jwt           the authenticated principal
     * @param environmentId the ID of the environment to update
     * @param newName       the new logical name
     * @return the updated environment document
     */
    @PatchMapping("/environments/{environmentId}/name")
    @Operation(summary = "Update Environment Name", description = "Updates the display name of a specific environment.")
    public ResponseEntity<ApiResponse<Environment>> updateEnvironmentName(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String environmentId,
            @RequestParam @NotBlank String newName
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Environment name updated successfully", environmentService.updateEnvironmentName(jwt, environmentId, newName));
    }

    /**
     * Invalidates the current SDK key and generates a fresh identifier.
     *
     * @param jwt           the authenticated principal
     * @param environmentId the ID of the environment for rotation
     * @return the updated environment document with a new SDK key
     */
    @PatchMapping("/environments/{environmentId}/rotate-sdk-key")
    @Operation(summary = "Rotate SDK Key", description = "Invalidates the existing SDK Key and generates a fresh platform identifier.")
    public ResponseEntity<ApiResponse<Environment>> rotateSdkKey(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String environmentId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "SDK Key rotated successfully", environmentService.rotateSdkKey(jwt, environmentId));
    }

    /**
     * Permanently removes an environment and its associated resource maps.
     *
     * @param jwt           the authenticated principal
     * @param environmentId the ID of the environment to terminate
     * @return a success response wrapper
     */
    @DeleteMapping("/environments/{environmentId}")
    @Operation(summary = "Delete Environment", description = "Permanently removes an environment and its flag configurations.")
    public ResponseEntity<ApiResponse<Void>> deleteEnvironment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String environmentId
    ) {
        environmentService.deleteEnvironment(jwt, environmentId);
        return ApiResponseBuilder.out(HttpStatus.OK, "Environment terminated successfully", null);
    }

}
