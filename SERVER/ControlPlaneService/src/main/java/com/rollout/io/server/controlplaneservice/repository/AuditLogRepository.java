package com.rollout.io.server.controlplaneservice.repository;

import com.rollout.io.server.controlplaneservice.entity.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Data access abstractions encapsulating MongoDB boundaries for AuditLog records.
 */
@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {

    /**
     * Resolves all sequential audit entries nested within a constrained environment namespace.
     *
     * @param environmentId the mapped identifier of the targeted environment
     * @return chronologically descending collection of history execution records
     */
    List<AuditLog> findAllByEnvironmentIdOrderByTimestampDesc(String environmentId);

}
