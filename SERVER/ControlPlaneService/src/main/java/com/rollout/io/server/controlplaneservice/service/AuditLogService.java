package com.rollout.io.server.controlplaneservice.service;

import com.rollout.io.server.controlplaneservice.entity.AuditLog;
import com.rollout.io.server.controlplaneservice.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

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
            // Non-blocking failure intended
        }
    }

    public List<AuditLog> getEnvironmentAuditLogs(String environmentId) {
        return auditLogRepository.findAllByEnvironmentIdOrderByTimestampDesc(environmentId); // Descending timeline
    }
}
