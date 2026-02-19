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

@Service
@RequiredArgsConstructor
public class UserServiceLogic implements UserService {

    private final UserRepository userRepository;

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

        return userRepository.findByFirebaseUid(uid)
                .orElseGet(() ->
                        userRepository.save(
                                User.builder()
                                        .firebaseUid(uid)
                                        .email(email)
                                        .displayName(name)
                                        .pictureUrl(picture)
                                        .emailVerified(Boolean.TRUE.equals(verified))
                                        .createdAt(Instant.now())
                                        .build()
                        )
                );

    }

    @Override
    public User updateDisplayName(Jwt jwt, String displayName) {
        User user = getUserByJwt(jwt);
        user.setDisplayName(displayName);
        user.setUpdatedAt(Instant.now());
        return userRepository.save(user);
    }

    @Override
    public User updatePictureUrl(Jwt jwt, String pictureUrl) {
        User user = getUserByJwt(jwt);
        user.setPictureUrl(pictureUrl);
        user.setUpdatedAt(Instant.now());
        return userRepository.save(user);
    }

    @Override
    public User addProjectId(Jwt jwt, String projectId) {
        User user = getUserByJwt(jwt);
        if (user.getProjectIds() == null) {
            user.setProjectIds(new java.util.HashSet<>());
        }
        user.getProjectIds().add(projectId);
        user.setUpdatedAt(Instant.now());
        return userRepository.save(user);
    }

    @Override
    public void deleteUser(Jwt jwt) {
        User user = getUserByJwt(jwt);
        userRepository.delete(user);
    }

    @Override
    public User removeProjectId(Jwt jwt, String projectId) {
        User user = getUserByJwt(jwt);
        if (user.getProjectIds() != null && user.getProjectIds().contains(projectId)) {
            user.getProjectIds().remove(projectId);
            user.setUpdatedAt(Instant.now());
            return userRepository.save(user);
        }
        return user;
    }

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
