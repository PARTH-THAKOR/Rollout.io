package com.rollout.io.server.controlplaneservice.logic;

import com.rollout.io.server.controlplaneservice.configuration.RabbitMQConfig;
import com.rollout.io.server.controlplaneservice.entity.Environment;
import com.rollout.io.server.controlplaneservice.entity.Project;
import com.rollout.io.server.controlplaneservice.events.EnvironmentDeletedEvent;
import com.rollout.io.server.controlplaneservice.events.ProjectDeletedEvent;
import com.rollout.io.server.controlplaneservice.events.UserDeletedEvent;
import com.rollout.io.server.controlplaneservice.repository.AuditLogRepository;
import com.rollout.io.server.controlplaneservice.repository.EnvironmentRepository;
import com.rollout.io.server.controlplaneservice.repository.FlagRepository;
import com.rollout.io.server.controlplaneservice.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * RabbitMQ consumer responsible for processing cascading deletion events.
 * Listens on dedicated queues for user, project, and environment deletion events,
 * executing hierarchical cleanup to ensure no orphaned documents remain in MongoDB.
 * Cascade chain:
 *   user.deleted   → deletes all Projects by UID → publishes project.deleted per project
 *   project.deleted → deletes all Environments by projectId → publishes environment.deleted per env
 *   environment.deleted → deletes all Flags + AuditLogs by environmentId
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CascadeDeleteConsumer {

    private final ProjectRepository projectRepository;
    private final EnvironmentRepository environmentRepository;
    private final FlagRepository flagRepository;
    private final AuditLogRepository auditLogRepository;
    private final RabbitTemplate rabbitTemplate;

    /**
     * Handles user deletion events published by AuthService.
     * Locates all Projects owned by the deleted user's UID, publishes a
     * {@link ProjectDeletedEvent} for each, and then bulk-removes the projects.
     *
     * @param event the user deletion event containing the Firebase UID
     */
    @RabbitListener(queues = RabbitMQConfig.USER_DELETED_QUEUE)
    public void handleUserDeleted(UserDeletedEvent event) {
        String uid = event.getUid();
        log.info("Received user.deleted event for UID: {}", uid);

        List<Project> projects = projectRepository.findAllByCreatedByUid(uid);
        log.info("Found {} projects to cascade-delete for UID: {}", projects.size(), uid);

        for (Project project : projects) {
            ProjectDeletedEvent projectEvent = ProjectDeletedEvent.builder()
                    .projectId(project.getId())
                    .timestamp(Instant.now())
                    .build();
            rabbitTemplate.convertAndSend(RabbitMQConfig.PROJECT_DELETED_ROUTING_KEY, projectEvent);
        }

        projectRepository.deleteAllByCreatedByUid(uid);
        log.info("Cascade-deleted all projects for UID: {}", uid);
    }

    /**
     * Handles project deletion events.
     * Locates all Environments belonging to the deleted project, publishes an
     * {@link EnvironmentDeletedEvent} for each, and then bulk-removes the environments.
     *
     * @param event the project deletion event containing the project ID
     */
    @RabbitListener(queues = RabbitMQConfig.PROJECT_DELETED_QUEUE)
    public void handleProjectDeleted(ProjectDeletedEvent event) {
        String projectId = event.getProjectId();
        log.info("Received project.deleted event for projectId: {}", projectId);

        List<Environment> environments = environmentRepository.findAllByProjectId(projectId);
        log.info("Found {} environments to cascade-delete for projectId: {}", environments.size(), projectId);

        for (Environment env : environments) {
            EnvironmentDeletedEvent envEvent = EnvironmentDeletedEvent.builder()
                    .environmentId(env.getId())
                    .timestamp(Instant.now())
                    .build();
            rabbitTemplate.convertAndSend(RabbitMQConfig.ENVIRONMENT_DELETED_ROUTING_KEY, envEvent);
        }

        environmentRepository.deleteAllByProjectId(projectId);
        log.info("Cascade-deleted all environments for projectId: {}", projectId);
    }

    /**
     * Handles environment deletion events.
     * Bulk-removes all Flags and AuditLogs scoped under the deleted environment.
     * This is the terminal node in the cascade chain — no further events are published.
     *
     * @param event the environment deletion event containing the environment ID
     */
    @RabbitListener(queues = RabbitMQConfig.ENVIRONMENT_DELETED_QUEUE)
    public void handleEnvironmentDeleted(EnvironmentDeletedEvent event) {
        String environmentId = event.getEnvironmentId();
        log.info("Received environment.deleted event for environmentId: {}", environmentId);

        flagRepository.deleteAllByEnvironmentId(environmentId);
        auditLogRepository.deleteAllByEnvironmentId(environmentId);

        log.info("Cascade-deleted all flags and audit logs for environmentId: {}", environmentId);
    }

}
