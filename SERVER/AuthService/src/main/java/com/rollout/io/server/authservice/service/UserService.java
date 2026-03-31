package com.rollout.io.server.authservice.service;

import com.rollout.io.server.authservice.entity.User;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

/**
 * Service interface defining the contractual blueprint for user management operations.
 * Allows implementations to abstract the underlying persistent storage configurations.
 */
@Service
public interface UserService {

    /**
     * Synchronizes a Firebase Identity JSON Web Token natively into the repository.
     * Generates a new dummy profile if standard claims are missing.
     *
     * @param jwt the incoming Firebase token asserting identity
     * @return the fully synchronized and persisted user object
     */
    User syncUser(Jwt jwt);

    /**
     * Updates the custom display name mapped to the provided identity token.
     *
     * @param jwt the incoming Firebase token
     * @param displayName the new public display name
     * @return the updated user object
     */
    User updateDisplayName(Jwt jwt, String displayName);

    /**
     * Updates the custom picture avatar mapped to the provided identity token.
     *
     * @param jwt the incoming Firebase token
     * @param pictureUrl the new fully resolved URL pointing to an avatar asset
     * @return the updated user object
     */
    User updatePictureUrl(Jwt jwt, String pictureUrl);

    /**
     * Completely removes the developer's entity and all relational data permanently.
     *
     * @param jwt the incoming Firebase token authenticating the operation
     */
    void deleteUser(Jwt jwt);


}
