package com.rollout.io.server.authservice.repository;

import com.rollout.io.server.authservice.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data MongoDB repository for CRUD operations and querying User identities.
 * Allows asynchronous operations mapping native Java components to Mongo collections.
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /**
     * Finds a user directly mapping to the authenticated Firebase ID Token subclaim.
     *
     * @param firebaseUid the unique identifier originating from Google Identity Service
     * @return an Optional wrapping the found entity
     */
    Optional<User> findByFirebaseUid(String firebaseUid);

}
