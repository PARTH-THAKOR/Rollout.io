package com.rollout.io.server.controlplaneservice.repository;

import com.rollout.io.server.controlplaneservice.entity.Project;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Data access abstractions encapsulating MongoDB boundaries for top level Project scopes.
 */
@Repository
public interface ProjectRepository extends MongoRepository<Project, String> {

    /**
     * Validates database structural consistency targeting names mapping the entire namespace.
     *
     * @param name target literal matching the configuration parameter
     * @return mapped configuration optional container isolated dynamically
     */
    Optional<Project> findByName(String name);

    /**
     * Safely locates explicit mapped associations bounding properties rigidly directly to UI authenticated credentials.
     *
     * @param createdByUid isolated identity parameter identifying active developers mapping properties
     * @return full comprehensive bounds mapping the full project topology structure
     */
    List<Project> findAllByCreatedByUid(String createdByUid);

    /**
     * Retrieves distinct configuration models strictly protecting evaluation through forced credential inclusion.
     *
     * @param id bounded project target object id representing exact row structure
     * @param createdByUid literal ID preventing cross namespace access
     * @return successfully mapped container verified and approved for evaluation
     */
    Optional<Project> findByIdAndCreatedByUid(String id, String createdByUid);

    /**
     * Applies wildcard match processing strictly scoping constraints through authentication ID patterns.
     *
     * @param createdByUid authorized token verification parameter identifier
     * @param name nested string fuzzy query parameter target
     * @return loosely evaluated bounds containing mapped string sequences
     */
    List<Project> findByCreatedByUidAndNameContainingIgnoreCase(String createdByUid, String name);

}
