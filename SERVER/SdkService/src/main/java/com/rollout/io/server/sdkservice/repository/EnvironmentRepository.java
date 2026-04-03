package com.rollout.io.server.sdkservice.repository;

import com.rollout.io.server.sdkservice.entity.Environment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Read-only Data access abstractions encapsulating MongoDB boundaries for SDK execution constraints.
 */
@Repository
public interface EnvironmentRepository extends MongoRepository<Environment, String> {

    /**
     * Resolves the environment safely matching exactly the public unauthenticated SDK polling token.
     *
     * @param sdkKey exact securely generated cryptographic execution identification boundary
     * @return bounded environment attached securely to the unique secret key
     */
    Optional<Environment> findBySdkKey(String sdkKey);

}
