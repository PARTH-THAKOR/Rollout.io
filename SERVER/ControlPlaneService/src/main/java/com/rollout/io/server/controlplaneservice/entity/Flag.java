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

    private String key;          // unique system identifier

    private String displayName;  // UI friendly name

    private String description;

    private FlagType type; // BOOLEAN, STRING, JSON

    private FlagCategory category; // CORE or DEPENDENT

    private Boolean enabled;

    private Object value;

    // Percentage rollout (0-100). null means 100% (fully rolled out to all users)
    private Integer rolloutPercentage;

    // Targeting rules — ALL must match (AND logic). null/empty = no targeting (everyone)
    private List<TargetingRule> targetingRules;

    // Only used if category = DEPENDENT
    private RuleNode dependency;

    private Integer version;

    private String createdByUid;

    private Instant createdAt;

    private Instant updatedAt;

}