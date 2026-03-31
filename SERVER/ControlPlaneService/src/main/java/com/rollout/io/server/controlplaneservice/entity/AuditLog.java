package com.rollout.io.server.controlplaneservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    @Id
    private String id;
    
    private String environmentId;
    
    private String action; // CREATE_FLAG, UPDATE_FLAG, DELETE_FLAG, TOGGLE_FLAG
    
    private String resourceId; // Flag ID or Environment ID
    private String resourceType; // FLAG
    
    private String userUid; // UID of user completing action
    
    private Object changes; // Detailed diffs or old/new state mapping
    
    private Instant timestamp;
}
