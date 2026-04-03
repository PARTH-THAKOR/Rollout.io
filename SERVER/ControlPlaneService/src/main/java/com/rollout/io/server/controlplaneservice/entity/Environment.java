package com.rollout.io.server.controlplaneservice.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * An environment scope belonging to a specific Project (e.g., Development, Staging, Production).
 * Maintains a unique SDK key used to securely authenticate runtime feature flag evaluations.
 */
@Document(collection = "environments")
@CompoundIndex(name = "project_env_unique",
        def = "{'projectId': 1, 'name': 1}",
        unique = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Environment {

    @Id
    private String id;

    @Indexed
    private String projectId;

    private String name;

    @Indexed(unique = true)
    private String sdkKey;

    private String createdByUid;

    private Instant createdAt;

}
