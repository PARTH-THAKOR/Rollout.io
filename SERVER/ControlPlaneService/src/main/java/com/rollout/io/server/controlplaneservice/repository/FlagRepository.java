package com.rollout.io.server.controlplaneservice.repository;

import com.rollout.io.server.controlplaneservice.entity.Flag;
import com.rollout.io.server.controlplaneservice.entity.FlagCategory;
import com.rollout.io.server.controlplaneservice.entity.FlagType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Data access abstractions encapsulating MongoDB boundaries for application Feature Flags.
 */
@Repository
public interface FlagRepository extends MongoRepository<Flag, String> {

    /**
     * Resolves the entire mapped hierarchy of flags spanning a targeted environment.
     *
     * @param environmentId the specific deployment boundary constraints
     * @return comprehensive block list of all encapsulated database elements
     */
    List<Flag> findAllByEnvironmentId(String environmentId);

    /**
     * Returns scoped groupings of purely Core or inherently Dependent evaluated flags.
     *
     * @param environmentId the mapped isolated namespace target
     * @param category exact grouping classification category boundary
     * @return subset array fulfilling category and environment mapping
     */
    List<Flag> findAllByEnvironmentIdAndCategory(String environmentId, FlagCategory category);

    /**
     * Isolates uniquely mapped features evaluating specifically distinct category variants and object constraints.
     *
     * @param environmentId target namespace identifying the runtime container
     * @param category bounding evaluation parameter (Core vs Dependent)
     * @param type explicit bounding primitive class type constraint mapping
     * @return filtered result matching distinct boolean configurations
     */
    List<Flag> findAllByEnvironmentIdAndCategoryAndType(String environmentId, FlagCategory category, FlagType type);

    /**
     * Inverses precise constraints fetching primitives but dropping structured object nodes like JSON variants.
     *
     * @param environmentId targeted namespace identifying the executing container
     * @param category grouping structure to query inside
     * @param type the blocked evaluation explicit boundary mapping format
     * @return sequence omitting explicitly matched parameter criteria
     */
    List<Flag> findAllByEnvironmentIdAndCategoryAndTypeNot(String environmentId, FlagCategory category, FlagType type);

    /**
     * Single string deterministic fetch pulling exact uniqueness through keys explicitly generated.
     *
     * @param environmentId bounding constraint enclosing namespace boundary
     * @param key globally unique identifier matching exact evaluations
     * @return distinct single match structure inside the Option class
     */
    Optional<Flag> findByEnvironmentIdAndKey(String environmentId, String key);

    /**
     * Single string deterministic fetch pulling exact uniqueness through UI display representations explicitly generated.
     *
     * @param environmentId bounding constraint enclosing namespace boundary
     * @param displayName explicitly matched UI visible label
     * @return distinct match based strictly on visualization properties
     */
    Optional<Flag> findByEnvironmentIdAndDisplayName(String environmentId, String displayName);

    /**
     * Bulk-removes all flags scoped under a specific environment during cascading deletion.
     *
     * @param environmentId the target environment identifier whose flags must be purged
     */
    void deleteAllByEnvironmentId(String environmentId);

}
