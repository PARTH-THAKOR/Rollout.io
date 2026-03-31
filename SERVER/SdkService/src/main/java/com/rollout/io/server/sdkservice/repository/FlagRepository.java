package com.rollout.io.server.sdkservice.repository;

import com.rollout.io.server.sdkservice.entity.Flag;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlagRepository extends MongoRepository<Flag, String> {
    List<Flag> findByEnvironmentId(String environmentId);
}
