package com.rollout.io.server.controlplaneservice.logic;

import com.rollout.io.server.controlplaneservice.entity.Project;
import com.rollout.io.server.controlplaneservice.exceptions.RolloutError;
import com.rollout.io.server.controlplaneservice.repository.ProjectRepository;
import com.rollout.io.server.controlplaneservice.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import com.rollout.io.server.controlplaneservice.helpers.JwtHelper;

import java.time.Instant;
import java.util.List;

/**
 * Concrete implementation of the ProjectService interface.
 * Handles exact data manipulation logic, JWT token ownership validation, and Database interactions for Projects.
 */
@Service
@RequiredArgsConstructor
public class ProjectServiceLogic implements ProjectService {

    private final ProjectRepository projectRepository;

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

    @Override
    public List<Project> getAllProjects(Jwt jwt) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        return projectRepository.findAllByCreatedByUid(uid);
    }

    @Override
    public Project getProject(Jwt jwt, String projectId) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        return projectRepository.findByIdAndCreatedByUid(projectId, uid)
                .orElseThrow(() -> new RolloutError("Project not found", HttpStatus.NOT_FOUND));
    }

    @Override
    public Project updateProjectName(Jwt jwt, String projectId, String newName) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        Project existingProject = projectRepository.findByIdAndCreatedByUid(projectId, uid)
                .orElseThrow(() -> new RolloutError("Project not found", HttpStatus.NOT_FOUND));
        
        if (existingProject.getName().equals(newName)) {
            return existingProject; // Name hasn't changed, return immediately
        }

        if (projectRepository.findByName(newName).isPresent()) {
            throw new RolloutError("Project name already exists", HttpStatus.CONFLICT);
        }

        existingProject.setName(newName);
        return projectRepository.save(existingProject);
    }

    @Override
    public Project updateProjectDescription(Jwt jwt, String projectId, String newDescription) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        Project existingProject = projectRepository.findByIdAndCreatedByUid(projectId, uid)
                .orElseThrow(() -> new RolloutError("Project not found", HttpStatus.NOT_FOUND));

        existingProject.setDescription(newDescription);
        return projectRepository.save(existingProject);
    }

    @Override
    public void deleteProject(Jwt jwt, String projectId) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        Project project = projectRepository.findByIdAndCreatedByUid(projectId, uid)
                .orElseThrow(() -> new RolloutError("Project not found", HttpStatus.NOT_FOUND));

        projectRepository.delete(project);
    }

    @Override
    public Project getProjectByName(Jwt jwt, String projectName) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        return projectRepository.findByName(projectName)
                .filter(p -> p.getCreatedByUid().equals(uid))
                .orElseThrow(() -> new RolloutError("Project not found", HttpStatus.NOT_FOUND));
    }

    @Override
    public List<Project> searchProjects(Jwt jwt, String query) {
        String uid = JwtHelper.getUidFromJwt(jwt);
        return projectRepository.findByCreatedByUidAndNameContainingIgnoreCase(uid, query);
    }

    // Helper method removed and delegated to JwtHelper
    
}
