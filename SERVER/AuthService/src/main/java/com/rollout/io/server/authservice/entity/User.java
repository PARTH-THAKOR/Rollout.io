package com.rollout.io.server.authservice.entity;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Set;

/**
 * Represents a developer identity authenticated via Firebase Auth.
 * Acts as the centralized User profile model persisted in MongoDB.
 */
@Document(collection = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    @NotBlank(message = "UID is required")
    private String firebaseUid;

    @Indexed(unique = true)
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String displayName;

    private String pictureUrl;

    private boolean emailVerified;


    private Instant createdAt;

    private Instant updatedAt;
}