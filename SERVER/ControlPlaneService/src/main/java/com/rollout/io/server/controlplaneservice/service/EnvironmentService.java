package com.rollout.io.server.controlplaneservice.service;

import com.rollout.io.server.controlplaneservice.entity.Environment;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service interface outlining the business logic for managing Environments.
 * Defines operations for scoping environments under projects, and managing SDK keys.
 */
@Service
public interface EnvironmentService {

    Environment createEnvironment(Jwt jwt, Environment environment);

    List<Environment> getEnvironmentsByProjectId(Jwt jwt, String projectId);

    Environment getEnvironmentById(Jwt jwt, String environmentId);
    
    // Deleting an environment might have consequences on active flags/rules, but let's assume simple delete for now.
    void deleteEnvironment(Jwt jwt, String environmentId);

    Environment rotateSdkKey(Jwt jwt, String environmentId);

    Environment updateEnvironmentName(Jwt jwt, String environmentId, String newName);

    Environment getEnvironmentBySdkKey(String sdkKey);

}
