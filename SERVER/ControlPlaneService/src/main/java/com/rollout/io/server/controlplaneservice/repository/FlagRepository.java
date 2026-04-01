package com.rollout.io.server.controlplaneservice.repository;

import com.rollout.io.server.controlplaneservice.entity.Flag;
import com.rollout.io.server.controlplaneservice.entity.FlagCategory;
import com.rollout.io.server.controlplaneservice.entity.FlagType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlagRepository extends MongoRepository<Flag, String> {

    List<Flag> findAllByEnvironmentId(String environmentId);

    List<Flag> findAllByEnvironmentIdAndCategory(String environmentId, FlagCategory category);

    List<Flag> findAllByEnvironmentIdAndCategoryAndType(String environmentId, FlagCategory category, FlagType type);

    List<Flag> findAllByEnvironmentIdAndCategoryAndTypeNot(String environmentId, FlagCategory category, FlagType type);

    Optional<Flag> findByEnvironmentIdAndKey(String environmentId, String key);

    Optional<Flag> findByEnvironmentIdAndDisplayName(String environmentId, String displayName);

}
