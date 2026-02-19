package com.rollout.io.server.authservice.service;

import com.rollout.io.server.authservice.entity.User;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
public interface UserService {

    User syncUser(Jwt jwt);

    User updateDisplayName(Jwt jwt, String displayName);

    User updatePictureUrl(Jwt jwt, String pictureUrl);

    User addProjectId(Jwt jwt, String projectId);

    void deleteUser(Jwt jwt);

    User removeProjectId(Jwt jwt, String projectId);

}
