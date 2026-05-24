package com.rollout.io.server.controlplaneservice.repository;

import com.rollout.io.server.controlplaneservice.entity.Environment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Data access abstractions encapsulating MongoDB boundaries for nested Environment entities.
 */
@Repository
public interface EnvironmentRepository extends MongoRepository<Environment, String> {

    /**
     * Isolates and returns all operational environments structured underneath a matching Project ID.
     *
     * @param projectId matching mapping link pointing up to the root project
     * @return comprehensive sequence of all attached runtime environments
     */
    List<Environment> findAllByProjectId(String projectId);

    /**
     * Resolves exact overlap intersection mapping a single unique environment within a Project.
     *
     * @param projectId exact project namespace identifier
     * @param name explicitly named string representation mapping a human label
     * @return the unique nested boundary matched safely in optional format
     */
    Optional<Environment> findByProjectIdAndName(String projectId, String name);

    /**
     * Queries environments exclusively through the immutable generated SDK verification key.
     *
     * @param sdkKey cryptographic authorization literal string
     * @return bounded environment attached securely to the unique secret key
     */
    Optional<Environment> findBySdkKey(String sdkKey);

    /**
     * Bulk-removes all environments scoped under a specific project during cascading deletion.
     *
     * @param projectId the target project identifier whose environments must be purged
     */
    void deleteAllByProjectId(String projectId);

}
