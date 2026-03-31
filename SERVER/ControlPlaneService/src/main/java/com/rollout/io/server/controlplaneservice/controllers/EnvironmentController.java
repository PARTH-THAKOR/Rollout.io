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
 * REST Controller for managing logical Environments scoped under explicit Projects.
 * Handles environment boundaries, SDK Key lifecycle generations, and isolation settings.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Environment Management", description = "Endpoints for managing environments within projects")
@Validated
public class EnvironmentController {

    private final EnvironmentService environmentService;

    // --- GET METHODS ---

    @GetMapping("/projects/{projectId}/environments")
    @Operation(summary = "Get Environments by Project", description = "Retrieves all environments belonging to a specific project.")
    public ResponseEntity<ApiResponse<List<Environment>>> getEnvironmentsByProject(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String projectId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Environments fetched successfully", environmentService.getEnvironmentsByProjectId(jwt, projectId));
    }

    @GetMapping("/environments/{environmentId}")
    @Operation(summary = "Get Environment by ID", description = "Retrieves a specific environment by its ID.")
    public ResponseEntity<ApiResponse<Environment>> getEnvironment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String environmentId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Environment fetched successfully", environmentService.getEnvironmentById(jwt, environmentId));
    }

    @GetMapping("/environments/by-sdk-key")
    @Operation(summary = "Get Environment by SDK Key", description = "Retrieves a specific environment by its SDK Key.")
    public ResponseEntity<ApiResponse<Environment>> getEnvironmentBySdkKey(
            @RequestHeader("x-sdk-key") @NotBlank String sdkKey
    ) {
        // This endpoint might be used by SDKs or internal services, so JWT might not be present or required depending on security policy.
        // For now, allowing it without explicit USER JWT requirement in the signature, but if the controller is secured globally, it needs adjustment.
        // Assuming it's for admin lookup for now.
        return ApiResponseBuilder.out(HttpStatus.OK, "Environment fetched successfully", environmentService.getEnvironmentBySdkKey(sdkKey));
    }

    // --- POST METHODS ---

    @PostMapping("/projects/{projectId}/environments")
    @Operation(summary = "Create Environment", description = "Creates a new environment within a specific project.")
    public ResponseEntity<ApiResponse<Environment>> createEnvironment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String projectId,
            @RequestBody Environment environment
    ) {
        // Ensure the environment is associated with the correct project from the path
        environment.setProjectId(projectId);
        return ApiResponseBuilder.out(HttpStatus.CREATED, "Environment created successfully", environmentService.createEnvironment(jwt, environment));
    }

    // --- PATCH METHODS ---

    @PatchMapping("/environments/{environmentId}/name")
    @Operation(summary = "Update Environment Name", description = "Updates the name of a specific environment.")
    public ResponseEntity<ApiResponse<Environment>> updateEnvironmentName(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String environmentId,
            @RequestParam @NotBlank String newName
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Environment name updated successfully", environmentService.updateEnvironmentName(jwt, environmentId, newName));
    }

    @PatchMapping("/environments/{environmentId}/rotate-key")
    @Operation(summary = "Rotate SDK Key", description = "Generates a new SDK key for the specified environment.")
    public ResponseEntity<ApiResponse<Environment>> rotateSdkKey(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String environmentId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "SDK Key rotated successfully", environmentService.rotateSdkKey(jwt, environmentId));
    }

    // --- DELETE METHODS ---

    @DeleteMapping("/environments/{environmentId}")
    @Operation(summary = "Delete Environment", description = "Permanently deletes an environment.")
    public ResponseEntity<ApiResponse<Void>> deleteEnvironment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String environmentId
    ) {
        environmentService.deleteEnvironment(jwt, environmentId);
        return ApiResponseBuilder.out(HttpStatus.OK, "Environment deleted successfully", null);
    }

}
