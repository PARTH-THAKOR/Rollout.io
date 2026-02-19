package com.rollout.io.server.authservice.controllers;

import com.rollout.io.server.authservice.entity.User;
import com.rollout.io.server.authservice.helpers.ApiResponseBuilder;
import com.rollout.io.server.authservice.objects.ApiResponse;
import com.rollout.io.server.authservice.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Endpoints for managing user profile and settings")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get Current User", description = "Retrieves or syncs the currently authenticated user's profile.")
    public ResponseEntity<ApiResponse<User>> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponseBuilder.out(HttpStatus.OK, "User fetched successfully", userService.syncUser(jwt));
    }

    @PatchMapping("/me/display-name")
    @Operation(summary = "Update Display Name", description = "Updates the display name of the current user.")
    public ResponseEntity<ApiResponse<User>> updateDisplayName(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam @NotBlank String displayName
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Display name updated successfully", userService.updateDisplayName(jwt, displayName));
    }

    @PatchMapping("/me/picture-url")
    @Operation(summary = "Update Picture URL", description = "Updates the profile picture URL of the current user.")
    public ResponseEntity<ApiResponse<User>> updatePictureUrl(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam @NotBlank String pictureUrl
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Picture URL updated successfully", userService.updatePictureUrl(jwt, pictureUrl));
    }

    @PostMapping("/me/projects")
    @Operation(summary = "Add Project ID", description = "Adds a project ID to the user's list of associated projects.")
    public ResponseEntity<ApiResponse<User>> addProjectId(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam @NotBlank String projectId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Project ID added successfully", userService.addProjectId(jwt, projectId));
    }

    @DeleteMapping("/me")
    @Operation(summary = "Delete User", description = "Permanently deletes the current user's account.")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@AuthenticationPrincipal Jwt jwt) {
        userService.deleteUser(jwt);
        return ApiResponseBuilder.out(HttpStatus.OK, "User deleted successfully", null);
    }

    @DeleteMapping("/me/projects/{projectId}")
    @Operation(summary = "Remove Project ID", description = "Removes a specific project ID from the user's associated projects.")
    public ResponseEntity<ApiResponse<User>> removeProjectId(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String projectId
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Project ID removed successfully", userService.removeProjectId(jwt, projectId));
    }
    
}
