package com.rollout.io.server.controlplaneservice.service;

import com.rollout.io.server.controlplaneservice.entity.Project;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service interface outlining the business logic for managing Projects.
 * Defines operations for workspace creation, retrieval, searching, and configuration updates.
 */
@Service
public interface ProjectService {

    Project createProject(Jwt jwt, Project project);

    List<Project> getAllProjects(Jwt jwt);

    Project getProject(Jwt jwt, String projectId);

    Project updateProjectName(Jwt jwt, String projectId, String newName);

    Project updateProjectDescription(Jwt jwt, String projectId, String newDescription);

    void deleteProject(Jwt jwt, String projectId);

    Project getProjectByName(Jwt jwt, String projectName);

    List<Project> searchProjects(Jwt jwt, String query);

}

