package com.rollout.io.server.controlplaneservice.service;

import com.rollout.io.server.controlplaneservice.entity.AuditLog;
import com.rollout.io.server.controlplaneservice.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * Service responsible for asynchronous tracking and recording of system events.
 * Captures mutations like flag updates and creations for security and history purposes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Executes asynchronous logging of mutations made to system resources ensuring UI execution isn't blocked.
     *
     * @param environmentId target namespace identifying where the resource operation happened
     * @param action string representation mapping the specific CRUD event
     * @param resourceId explicit primary key of the modified object
     * @param resourceType category literal classifying the data shape
     * @param userUid explicit developer credentials initiating the change
     * @param changes serialized JSON or textual diff explaining what properties altered
     */
    @Async
    public void logActivity(String environmentId, String action, String resourceId, String resourceType, String userUid, Object changes) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .environmentId(environmentId)
                    .action(action)
                    .resourceId(resourceId)
                    .resourceType(resourceType)
                    .userUid(userUid)
                    .changes(changes)
                    .timestamp(Instant.now())
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to persist audit log: {} for resource {}", action, resourceId, e);
        }
    }

    /**
     * Retrieves chronological platform operation sequences scoped solely to a single environment.
     *
     * @param environmentId target environment identity namespace
     * @return sequence array of all matching system event entries
     */
    public List<AuditLog> getEnvironmentAuditLogs(String environmentId) {
        return auditLogRepository.findAllByEnvironmentIdOrderByTimestampDesc(environmentId);
    }

}
