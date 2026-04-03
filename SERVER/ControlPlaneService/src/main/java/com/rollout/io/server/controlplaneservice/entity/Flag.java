package com.rollout.io.server.controlplaneservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/**
 * Represents a Feature Flag entity active within a designated Environment.
 * Acts as the centralized model for both standalone CORE flags and complex DEPENDENT flags.
 * Tracks audience targeting profiles, percentage rollouts, and hierarchical prerequisites.
 */
@Document(collection = "flags")
@CompoundIndex(
        name = "env_flag_unique",
        def = "{'environmentId': 1, 'key': 1}",
        unique = true
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Flag {

    @Id
    private String id;

    @Indexed
    private String environmentId;

    private String key;

    private String displayName;

    private String description;

    private FlagType type;

    private FlagCategory category;

    private Boolean enabled;

    private Object value;

    private Integer rolloutPercentage;

    private List<TargetingRule> targetingRules;

    private RuleNode dependency;

    private Integer version;

    private String createdByUid;

    private Instant createdAt;

    private Instant updatedAt;

}