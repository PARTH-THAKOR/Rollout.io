package com.rollout.io.server.controlplaneservice.logic;

import com.rollout.io.server.controlplaneservice.configuration.RabbitMQConfig;
import com.rollout.io.server.controlplaneservice.entity.Project;
import com.rollout.io.server.controlplaneservice.events.ProjectDeletedEvent;
import com.rollout.io.server.controlplaneservice.exceptions.RolloutError;
import com.rollout.io.server.controlplaneservice.helpers.JwtHelper;
import com.rollout.io.server.controlplaneservice.repository.ProjectRepository;
import com.rollout.io.server.controlplaneservice.service.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * Concrete implementation of the ProjectService interface.
 * Handles exact data manipulation logic, JWT token ownership validation, and Database interactions for Projects.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceLogic implements ProjectService {

    private final ProjectRepository projectRepository;
    private final RabbitTemplate rabbitTemplate;

    /**
     * Bootstraps a new workspace project initialized by the authorized user.
     * Ensures duplicate project names do not exist across the platform.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param project the raw project configuration to persist
     * @return the fully hydrated project model persisted in MongoDB
     * @throws RolloutError if a project with the same name already exists
     */
    @Override
    public Project createProject(Jwt jwt, Project project) {
        String uid = JwtHelper.getUidFromJwt(jwt);

        if (projectRepository.findByName(project.getName()).isPresent()) {
            throw new RolloutError("Project name already exists", HttpStatus.CONFLICT);
        }

        project.setCreatedByUid(uid);
        project.setCreatedAt(Instant.now());

        return projectRepository.save(project);
    }

    /**
     * Iterates all top-level workspace projects scoped solely to the requesting user.
     *
     * @param jwt the verified authorization JWT of the caller
     * @return a list containing all projects owned by the extracted user ID
     */
    @Override
    public List<Project> getAllProjects(Jwt jwt) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        return projectRepository.findAllByCreatedByUid(uid);
    }

    /**
     * Resolves a scoped workspace boundary specifically by its database identifier.
     * Verifies that the resolved project belongs strictly to the authenticated user.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param projectId the isolated UUID or Mongo ID of the target project
     * @return the validated project entity mapping
     * @throws RolloutError if no project is found, or if the user is unauthorized
     */
    @Override
    public Project getProject(Jwt jwt, String projectId) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        return projectRepository.findByIdAndCreatedByUid(projectId, uid)
                .orElseThrow(() -> new RolloutError("Project not found", HttpStatus.NOT_FOUND));
    }

    /**
     * Overwrites the human-readable namespace attached to the targeted project.
     * Enforces uniqueness verification so that overlap collision doesn't occur.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param projectId the target project's unique identifier
     * @param newName the newly provided display title
     * @return the successfully updated project document
     * @throws RolloutError if the new project name already conflicts
     */
    @Override
    public Project updateProjectName(Jwt jwt, String projectId, String newName) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        Project existingProject = projectRepository.findByIdAndCreatedByUid(projectId, uid)
                .orElseThrow(() -> new RolloutError("Project not found", HttpStatus.NOT_FOUND));

        if (existingProject.getName().equals(newName)) {
            return existingProject;
        }

        if (projectRepository.findByName(newName).isPresent()) {
            throw new RolloutError("Project name already exists", HttpStatus.CONFLICT);
        }

        existingProject.setName(newName);
        return projectRepository.save(existingProject);
    }

    /**
     * Safely updates or rewrites the optional project context representation string.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param projectId the specific project document identifier
     * @param newDescription the updated multiline plain description parameter
     * @return the fully updated project record
     * @throws RolloutError if the project is inaccessible
     */
    @Override
    public Project updateProjectDescription(Jwt jwt, String projectId, String newDescription) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        Project existingProject = projectRepository.findByIdAndCreatedByUid(projectId, uid)
                .orElseThrow(() -> new RolloutError("Project not found", HttpStatus.NOT_FOUND));

        existingProject.setDescription(newDescription);
        return projectRepository.save(existingProject);
    }

    /**
     * Triggers a hard destructive deletion of an active workspace project entity.
     * Publishes a {@link ProjectDeletedEvent} to RabbitMQ so that the cascade consumer
     * can clean up all Environments, Flags, and AuditLogs belonging to this project.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param projectId the specific boundary identifier of the project to erase
     * @throws RolloutError if the project is missing or user does not own it
     */
    @Override
    public void deleteProject(Jwt jwt, String projectId) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        Project project = projectRepository.findByIdAndCreatedByUid(projectId, uid)
                .orElseThrow(() -> new RolloutError("Project not found", HttpStatus.NOT_FOUND));

        projectRepository.delete(project);

        ProjectDeletedEvent event = ProjectDeletedEvent.builder()
                .projectId(projectId)
                .timestamp(Instant.now())
                .build();
        rabbitTemplate.convertAndSend(RabbitMQConfig.PROJECT_DELETED_ROUTING_KEY, event);
        log.info("Published project.deleted event for projectId: {}", projectId);
    }

    /**
     * Selectively filters a project record using its exact human string name.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param projectName the explicitly defined project namespace
     * @return the hydrated specific workspace project match
     * @throws RolloutError if it doesn't match strings precisely
     */
    @Override
    public Project getProjectByName(Jwt jwt, String projectName) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        return projectRepository.findByName(projectName)
                .filter(p -> p.getCreatedByUid().equals(uid))
                .orElseThrow(() -> new RolloutError("Project not found", HttpStatus.NOT_FOUND));
    }

    /**
     * Conducts a wildcard fuzzy pattern evaluation to match partial strings
     * against all available project names for the requested user.
     *
     * @param jwt the verified authorization JWT of the caller
     * @param query the partial substring pattern applied during scan
     * @return a mapped collection list containing the matching project elements
     */
    @Override
    public List<Project> searchProjects(Jwt jwt, String query) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        return projectRepository.findByCreatedByUidAndNameContainingIgnoreCase(uid, query);
    }

}
