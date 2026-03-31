package com.rollout.io.server.authservice.logic;

import com.rollout.io.server.authservice.entity.User;
import com.rollout.io.server.authservice.exceptions.RolloutError;
import com.rollout.io.server.authservice.repository.UserRepository;
import com.rollout.io.server.authservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Service orchestrating user persistence and Firebase Identity mappings.
 * It manages extracting JWT claims from Firebase API tokens and resolving
 * those claims against internal user states on relational data-stores.
 */
@Service
@RequiredArgsConstructor
public class UserServiceLogic implements UserService {

    private final UserRepository userRepository;

    /**
     * Synchronizes a Firebase user identity into the local MongoDB store.
     * Creates a new user record if one does not exist for the given UID.
     *
     * @param jwt the incoming Firebase ID token
     * @return the persisted or existing user entity
     */
    @Override
    public User syncUser(Jwt jwt) {
        if (jwt == null)
            throw new RolloutError("Invalid authentication token", HttpStatus.UNAUTHORIZED);
        String uid = jwt.getSubject();

        if (uid == null || uid.isBlank())
            throw new RolloutError("Invalid token: UID missing", HttpStatus.UNAUTHORIZED);
            
        String email = jwt.getClaim("email");
        String name = jwt.getClaim("name");
        String picture = jwt.getClaim("picture");
        Boolean verified = jwt.getClaim("email_verified");

        if (name == null || name.isBlank()) {
            if (email != null && email.contains("@")) {
                String prefix = email.split("@")[0];
                name = "User_" + (prefix.length() >= 4 ? prefix.substring(0, 4) : prefix);
            } else {
                name = "User_Guest";
            }
        }

        if (picture == null || picture.isBlank()) {
            picture = "https://ui-avatars.com/api/?name=" + name + "&background=random";
        }

        final String finalName = name;
        final String finalPicture = picture;

        return userRepository.findByFirebaseUid(uid)
                .orElseGet(() ->
                        userRepository.save(
                                User.builder()
                                        .firebaseUid(uid)
                                        .email(email)
                                        .displayName(finalName)
                                        .pictureUrl(finalPicture)
                                        .emailVerified(Boolean.TRUE.equals(verified))
                                        .createdAt(Instant.now())
                                        .build()
                        )
                );

    }

    /**
     * Updates the display name for the authenticated user.
     *
     * @param jwt the incoming Firebase ID token
     * @param displayName the new display name value
     * @return the updated user entity
     */
    @Override
    public User updateDisplayName(Jwt jwt, String displayName) {
        User user = getUserByJwt(jwt);
        user.setDisplayName(displayName);
        user.setUpdatedAt(Instant.now());
        return userRepository.save(user);
    }

    /**
     * Updates the profile picture URL for the authenticated user.
     *
     * @param jwt the incoming Firebase ID token
     * @param pictureUrl the new avatar URL
     * @return the updated user entity
     */
    @Override
    public User updatePictureUrl(Jwt jwt, String pictureUrl) {
        User user = getUserByJwt(jwt);
        user.setPictureUrl(pictureUrl);
        user.setUpdatedAt(Instant.now());
        return userRepository.save(user);
    }

    /**
     * Permanently deletes the authenticated user's record from the database.
     *
     * @param jwt the incoming Firebase ID token
     */
    @Override
    public void deleteUser(Jwt jwt) {
        User user = getUserByJwt(jwt);
        userRepository.delete(user);
    }


    /**
     * Resolves the internal user entity from the JWT subject claim.
     *
     * @param jwt the incoming Firebase ID token
     * @return the matched user entity
     * @throws RolloutError if the user is not found
     */
    private User getUserByJwt(Jwt jwt) {
        if (jwt == null) {
            throw new RolloutError("Invalid authentication token", HttpStatus.UNAUTHORIZED);
        }
        String uid = jwt.getSubject();
        if (uid == null || uid.isBlank()) {
            throw new RolloutError("Invalid token: UID missing", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByFirebaseUid(uid)
                .orElseThrow(() -> new RolloutError("User not found with uid: " + uid, HttpStatus.NOT_FOUND));
    }

}
