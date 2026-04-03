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
 * REST controller for managing developer projects.
 * Orchestrates the creation, retrieval, and modification of project workspaces.
 */
@RestController
@RequestMapping("/apiControl/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Project Management", description = "Endpoints for managing hierarchical projects")
@Validated
public class ProjectController {

    private final ProjectService projectService;

    /**
     * Lists all projects associated with the authenticated user.
     *
     * @param jwt the authenticated principal
     * @return a collection of projects
     */
    @GetMapping
    @Operation(summary = "Get All Projects", description = "Retrieves all projects owned by the authenticated user.")
    public ResponseEntity<ApiResponse<List<Project>>> getAllProjects(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Projects retrieved successfully", projectService.getAllProjects(jwt));
    }

    /**
     * Retrieves a specific project by its unique identifier.
     *
     * @param jwt       the authenticated principal
     * @param projectId the ID of the target project
     * @return the project details
     */
    @GetMapping("/{projectId}")
    @Operation(summary = "Get Project by ID", description = "Retrieves a specific project using its unique ID.")
    public ResponseEntity<ApiResponse<Project>> getProject(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String projectId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Project retrieved successfully", projectService.getProject(jwt, projectId));
    }

    /**
     * Performs a substring search across project names within the user's scope.
     *
     * @param jwt   the authenticated principal
     * @param query the search term
     * @return a list of matching projects
     */
    @GetMapping("/search")
    @Operation(summary = "Search Projects", description = "Searches for projects by name within the user's accessible scope.")
    public ResponseEntity<ApiResponse<List<Project>>> searchProjects(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam @NotBlank String query
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Searching completed successfully", projectService.searchProjects(jwt, query));
    }

    /**
     * Finds a project by its exact name.
     *
     * @param jwt  the authenticated principal
     * @param name the exact name to look for
     * @return the project details
     */
    @GetMapping("/by-name")
    @Operation(summary = "Get Project by Name", description = "Retrieves a specific project using its logical name.")
    public ResponseEntity<ApiResponse<Project>> getProjectByName(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam @NotBlank String name
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Project located successfully", projectService.getProjectByName(jwt, name));
    }

    /**
     * Initializes a new project workspace.
     *
     * @param jwt     the authenticated principal
     * @param project the project configuration to persist
     * @return the saved project document
     */
    @PostMapping
    @Operation(summary = "Create Project", description = "Creates a new project for the authenticated user.")
    public ResponseEntity<ApiResponse<Project>> createProject(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Project project
    ) {
        return ApiResponseBuilder.out(HttpStatus.CREATED, "Project initialized successfully", projectService.createProject(jwt, project));
    }

    /**
     * Updates the logical name of an existing project.
     *
     * @param jwt       the authenticated principal
     * @param projectId the ID of the project to update
     * @param newName   the new display name
     * @return the updated project document
     */
    @PatchMapping("/{projectId}/name")
    @Operation(summary = "Update Project Name", description = "Updates the display name of an existing project.")
    public ResponseEntity<ApiResponse<Project>> updateProjectName(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String projectId,
            @RequestParam @NotBlank String newName
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Project name updated successfully", projectService.updateProjectName(jwt, projectId, newName));
    }

    /**
     * Updates the description metadata for a specific project.
     *
     * @param jwt            the authenticated principal
     * @param projectId      the ID of the project to update
     * @param newDescription the updated descriptive text
     * @return the updated project document
     */
    @PatchMapping("/{projectId}/description")
    @Operation(summary = "Update Project Description", description = "Updates the metadata description for a specific project.")
    public ResponseEntity<ApiResponse<Project>> updateProjectDescription(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String projectId,
            @RequestParam @NotBlank String newDescription
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Project description updated successfully", projectService.updateProjectDescription(jwt, projectId, newDescription));
    }

    /**
     * Permanently removes a project workspace and all child resources.
     *
     * @param jwt       the authenticated principal
     * @param projectId the ID of the project to remove
     * @return a success response wrapper
     */
    @DeleteMapping("/{projectId}")
    @Operation(summary = "Delete Project", description = "Permanently removes a project and its associated metadata.")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable @NotBlank String projectId
    ) {
        projectService.deleteProject(jwt, projectId);
        return ApiResponseBuilder.out(HttpStatus.OK, "Project terminated successfully", null);
    }

}
