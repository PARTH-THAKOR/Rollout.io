package com.rollout.io.server.controlplaneservice.logic;

import com.rollout.io.server.controlplaneservice.entity.Environment;
import com.rollout.io.server.controlplaneservice.exceptions.RolloutError;
import com.rollout.io.server.controlplaneservice.repository.EnvironmentRepository;
import com.rollout.io.server.controlplaneservice.repository.ProjectRepository;
import com.rollout.io.server.controlplaneservice.service.EnvironmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import com.rollout.io.server.controlplaneservice.helpers.JwtHelper;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Concrete implementation of the EnvironmentService interface.
 * Enforces hierarchical association of Environments within Projects and ensures SDK keys are safely generated and validated.
 */
@Service
@RequiredArgsConstructor
public class EnvironmentServiceLogic implements EnvironmentService {

    private final EnvironmentRepository environmentRepository;
    private final ProjectRepository projectRepository;

    @Override
    public Environment createEnvironment(Jwt jwt, Environment environment) {
        String uid = JwtHelper.getUidFromJwt(jwt);

        // Verify user owns the project
        projectRepository.findByIdAndCreatedByUid(environment.getProjectId(), uid)
                .orElseThrow(() -> new RolloutError("Project not found or access denied", HttpStatus.NOT_FOUND));

        // Check if environment name already exists for this project
        if (environmentRepository.findByProjectIdAndName(environment.getProjectId(), environment.getName()).isPresent()) {
            throw new RolloutError("Environment with this name already exists in the project", HttpStatus.CONFLICT);
        }

        // Generate SDK Key
        environment.setSdkKey(generateSdkKey());
        environment.setCreatedByUid(uid);
        environment.setCreatedAt(Instant.now());

        return environmentRepository.save(environment);
    }

    @Override
    public List<Environment> getEnvironmentsByProjectId(Jwt jwt, String projectId) {
        String uid = JwtHelper.getUidFromJwt(jwt);

        // Verify user owns the project
        projectRepository.findByIdAndCreatedByUid(projectId, uid)
                .orElseThrow(() -> new RolloutError("Project not found or access denied", HttpStatus.NOT_FOUND));

        return environmentRepository.findAllByProjectId(projectId);
    }

    @Override
    public Environment getEnvironmentById(Jwt jwt, String environmentId) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        Environment environment = environmentRepository.findById(environmentId)
                .orElseThrow(() -> new RolloutError("Environment not found", HttpStatus.NOT_FOUND));

        // Allow access if user owns the project associated with this environment
        projectRepository.findByIdAndCreatedByUid(environment.getProjectId(), uid)
                .orElseThrow(() -> new RolloutError("Access denied to this environment", HttpStatus.FORBIDDEN));

        return environment;
    }

    @Override
    public void deleteEnvironment(Jwt jwt, String environmentId) {
        Environment environment = getEnvironmentById(jwt, environmentId); // Reuses the access check

        environmentRepository.delete(environment);
    }

    @Override
    public Environment rotateSdkKey(Jwt jwt, String environmentId) {
        Environment environment = getEnvironmentById(jwt, environmentId); // Reuses the access check

        environment.setSdkKey(generateSdkKey());
        return environmentRepository.save(environment);
    }

    @Override
    public Environment updateEnvironmentName(Jwt jwt, String environmentId, String newName) {
        Environment environment = getEnvironmentById(jwt, environmentId); // Reuses the access check

        if (environment.getName().equals(newName)) {
            return environment; // Name hasn't changed, return immediately
        }

        // Check if new name already exists in the same project
        if (environmentRepository.findByProjectIdAndName(environment.getProjectId(), newName).isPresent()) {
            throw new RolloutError("Environment with this name already exists in the project", HttpStatus.CONFLICT);
        }

        environment.setName(newName);
        return environmentRepository.save(environment);
    }

    @Override
    public Environment getEnvironmentBySdkKey(String sdkKey) {
        return environmentRepository.findBySdkKey(sdkKey)
                .orElseThrow(() -> new RolloutError("Environment not found for the given SDK Key", HttpStatus.NOT_FOUND));
    }

    // Delegated to JwtHelper

    private String generateSdkKey() {
        return "sdk_" + UUID.randomUUID().toString().replace("-", "");
    }
    
}
