package com.rollout.io.server.authservice.repository;

import com.rollout.io.server.authservice.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByFirebaseUid(String firebaseUid);

}
