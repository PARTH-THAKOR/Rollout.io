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

/**
 * REST Controller for managing user profiles and settings within the Auth Service.
 * Exposes securely authenticated endpoints for fetching, updating, or deleting
 * the current developer's platform identity.
 */
@RestController
@RequestMapping("/apiAuth/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Endpoints for managing user profile and settings")
public class UserController {

    private final UserService userService;

    /**
     * Retrieves the profile of the current authenticated developer.
     * Extracts identity details securely straight from the JWT structure.
     *
     * @param jwt the validated incoming Firebase token
     * @return the User's persistent state
     */
    @GetMapping("/me")
    @Operation(summary = "Get Current User", description = "Retrieves or syncs the currently authenticated user's profile.")
    public ResponseEntity<ApiResponse<User>> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponseBuilder.out(HttpStatus.OK, "User fetched successfully", userService.syncUser(jwt));
    }

    /**
     * Modifies the primary display name representing the developer inside the system.
     *
     * @param jwt the validated token
     * @param displayName the new desired string literal 
     * @return the actively updated User profile
     */
    @PatchMapping("/me/display-name")
    @Operation(summary = "Update Display Name", description = "Updates the display name of the current user.")
    public ResponseEntity<ApiResponse<User>> updateDisplayName(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam @NotBlank String displayName
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Display name updated successfully", userService.updateDisplayName(jwt, displayName));
    }

    /**
     * Edits the avatar visual representation pointing to an asset URL.
     *
     * @param jwt the validated incoming context token
     * @param pictureUrl the fully qualified path string
     * @return the actively updated User profile
     */
    @PatchMapping("/me/picture-url")
    @Operation(summary = "Update Picture URL", description = "Updates the profile picture URL of the current user.")
    public ResponseEntity<ApiResponse<User>> updatePictureUrl(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam @NotBlank String pictureUrl
    ) {
        return ApiResponseBuilder.out(HttpStatus.OK, "Picture URL updated successfully", userService.updatePictureUrl(jwt, pictureUrl));
    }

    /**
     * Shreds and purges the entire associated user workspace.
     * Does NOT necessarily revoke Firebase Auth data automatically.
     *
     * @param jwt the secure context payload asserting the deletion
     */
    @DeleteMapping("/me")
    @Operation(summary = "Delete User", description = "Permanently deletes the current user's account.")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@AuthenticationPrincipal Jwt jwt) {
        userService.deleteUser(jwt);
        return ApiResponseBuilder.out(HttpStatus.OK, "User deleted successfully", null);
    }


}
