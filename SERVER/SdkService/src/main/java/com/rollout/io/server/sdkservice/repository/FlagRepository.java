package com.rollout.io.server.sdkservice.repository;

import com.rollout.io.server.sdkservice.entity.Flag;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Read-only Data access abstractions mapping Mongo structures for Feature Flag evaluation.
 */
@Repository
public interface FlagRepository extends MongoRepository<Flag, String> {

    /**
     * Extracts exactly the subset configuration array associated globally with an authentic namespace boundary.
     *
     * @param environmentId target isolated namespace boundary encapsulating all evaluated parameters
     * @return sequence array enclosing isolated flag parameters
     */
    List<Flag> findByEnvironmentId(String environmentId);

}
