package com.rollout.io.server.controlplaneservice.repository;

import com.rollout.io.server.controlplaneservice.entity.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    
    List<AuditLog> findAllByEnvironmentIdOrderByTimestampDesc(String environmentId);

}
