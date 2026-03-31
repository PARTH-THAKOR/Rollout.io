package com.rollout.io.server.sdkservice.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

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

    private String name; // dev, staging, prod

    @Indexed(unique = true)
    private String sdkKey; // unique across system

    private String createdByUid;

    private Instant createdAt;

}
