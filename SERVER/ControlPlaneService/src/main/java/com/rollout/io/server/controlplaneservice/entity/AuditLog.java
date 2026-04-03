package com.rollout.io.server.controlplaneservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Entity representing an immutable platform transaction/audit record.
 */
@Document(collection = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    @Id
    private String id;
    
    private String environmentId;
    
    private String action;
    
    private String resourceId;

    private String resourceType;
    
    private String userUid;
    
    private Object changes;
    
    private Instant timestamp;

}

