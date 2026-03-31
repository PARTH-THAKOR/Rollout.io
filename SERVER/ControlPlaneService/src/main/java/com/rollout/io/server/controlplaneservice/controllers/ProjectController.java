package com.rollout.io.server.controlplaneservice.controllers;

import com.rollout.io.server.controlplaneservice.entity.Project;
import com.rollout.io.server.controlplaneservice.helpers.ApiResponseBuilder;
import com.rollout.io.server.controlplaneservice.objects.ApiResponse;
import com.rollout.io.server.controlplaneservice.service.ProjectService;
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
 * REST Controller for managing hierarchical Projects within the Control Plane.
 * Exposes securely authenticated endpoints for creating, searching, and mutating individual developer workspaces.
 */
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Project Management", description = "Endpoints for managing projects")
@Validated
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @Operation(summary = "Get All Projects", description = "Retrieves all projects owned by the authenticated user.")
    public ResponseEntity<ApiResponse<List<Project>>> getAllProjects(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Projects fetched successfully", projectService.getAllProjects(jwt));
    }

    @GetMapping("/{projectId}")
    @Operation(summary = "Get Project by ID", description = "Retrieves a specific project by its ID.")
    public ResponseEntity<ApiResponse<Project>> getProject(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String projectId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Project fetched successfully", projectService.getProject(jwt, projectId));
    }

    @GetMapping("/search")
    @Operation(summary = "Search Projects", description = "Searches for projects by name within the user's scope.")
    public ResponseEntity<ApiResponse<List<Project>>> searchProjects(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam @NotBlank String query
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Projects found successfully", projectService.searchProjects(jwt, query));
    }

    @GetMapping("/by-name")
    @Operation(summary = "Get Project by Name", description = "Retrieves a specific project by its name.")
    public ResponseEntity<ApiResponse<Project>> getProjectByName(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam @NotBlank String name
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Project fetched successfully", projectService.getProjectByName(jwt, name));
    }

    @PostMapping
    @Operation(summary = "Create Project", description = "Creates a new project for the authenticated user.")
    public ResponseEntity<ApiResponse<Project>> createProject(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Project project
    ) {
        return ApiResponseBuilder.out(HttpStatus.CREATED, "Project created successfully", projectService.createProject(jwt, project));
    }

    @PatchMapping("/{projectId}/name")
    @Operation(summary = "Update Project Name", description = "Updates the name of a specific project.")
    public ResponseEntity<ApiResponse<Project>> updateProjectName(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String projectId,
            @RequestParam @NotBlank String newName
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Project name updated successfully", projectService.updateProjectName(jwt, projectId, newName));
    }

    @PatchMapping("/{projectId}/description")
    @Operation(summary = "Update Project Description", description = "Updates the description of a specific project.")
    public ResponseEntity<ApiResponse<Project>> updateProjectDescription(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String projectId,
            @RequestParam @NotBlank String newDescription
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Project description updated successfully", projectService.updateProjectDescription(jwt, projectId, newDescription));
    }

    @DeleteMapping("/{projectId}")
    @Operation(summary = "Delete Project", description = "Permanently deletes a project.")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String projectId
    ) {
        projectService.deleteProject(jwt, projectId);
        return ApiResponseBuilder.out(HttpStatus.OK, "Project deleted successfully", null);
    }

}
