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

    /**
     * Bootstraps a new workspace project initialized by the authorized user.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param project the raw project configuration to persist
     * @return the fully hydrated project model persisted in MongoDB
     */
    Project createProject(Jwt jwt, Project project);

    /**
     * Iterates all top-level workspace projects scoped solely to the requesting user.
     *
     * @param jwt the verified authorization JWT of the caller
     * @return a list containing all projects owned by the extracted user ID
     */
    List<Project> getAllProjects(Jwt jwt);

    /**
     * Resolves a scoped workspace boundary specifically by its database identifier.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param projectId the isolated UUID or Mongo ID of the target project
     * @return the validated project entity mapping
     */
    Project getProject(Jwt jwt, String projectId);

    /**
     * Overwrites the human-readable namespace attached to the targeted project.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param projectId the target project's unique identifier
     * @param newName the newly provided display title
     * @return the successfully updated project document
     */
    Project updateProjectName(Jwt jwt, String projectId, String newName);

    /**
     * Safely updates or rewrites the optional project context representation string.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param projectId the specific project document identifier
     * @param newDescription the updated multiline plain description parameter
     * @return the fully updated project record
     */
    Project updateProjectDescription(Jwt jwt, String projectId, String newDescription);

    /**
     * Triggers a hard destructive deletion of an active workspace project entity.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param projectId the specific boundary identifier of the project to erase
     */
    void deleteProject(Jwt jwt, String projectId);

    /**
     * Selectively filters a project record using its exact human string name.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param projectName the explicitly defined project namespace
     * @return the hydrated specific workspace project match
     */
    Project getProjectByName(Jwt jwt, String projectName);

    /**
     * Conducts a wildcard fuzzy pattern evaluation to match partial strings.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param query the partial substring pattern applied during scan
     * @return a mapped collection list containing the matching project elements
     */
    List<Project> searchProjects(Jwt jwt, String query);

}
