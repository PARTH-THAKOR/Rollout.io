package com.rollout.io.server.controlplaneservice.controllers;

import com.rollout.io.server.controlplaneservice.entity.AuditLog;
import com.rollout.io.server.controlplaneservice.helpers.ApiResponseBuilder;
import com.rollout.io.server.controlplaneservice.objects.ApiResponse;
import com.rollout.io.server.controlplaneservice.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for managing and retrieving historical audit logs.
 * Provides transparency into resource mutations and platform events.
 */
@RestController
@RequestMapping("/apiControl/v1/environments/{environmentId}/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Audit Logs", description = "Operations for retrieving historical activity logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * Retrieves the chronological history of events for a specific environment.
     *
     * @param environmentId the unique identifier of the environment
     * @return a collection of audit log entries
     */
    @GetMapping
    @Operation(summary = "Get Audit Logs", description = "Retrieves all mutation logs and lifecycle events for the specified environment scope.")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs(@PathVariable String environmentId) {
        return ApiResponseBuilder.out(
                HttpStatus.OK,
                "Audit logs retrieved successfully",
                auditLogService.getEnvironmentAuditLogs(environmentId)
        );
    }

}
