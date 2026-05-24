package com.rollout.io.server.controlplaneservice.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

/**
 * Event payload published internally when an Environment is deleted.
 * Triggers cascading deletion of all Flags and AuditLogs belonging to the specified Environment.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnvironmentDeletedEvent implements Serializable {

    /**
     * The MongoDB document ID of the deleted Environment.
     */
    private String environmentId;

    /**
     * ISO-8601 timestamp marking when the deletion was initiated.
     */
    private Instant timestamp;

}
