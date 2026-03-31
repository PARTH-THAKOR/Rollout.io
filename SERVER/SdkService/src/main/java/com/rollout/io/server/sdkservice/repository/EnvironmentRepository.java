package com.rollout.io.server.sdkservice.repository;

import com.rollout.io.server.sdkservice.entity.Environment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EnvironmentRepository extends MongoRepository<Environment, String> {
    Optional<Environment> findBySdkKey(String sdkKey);
}
