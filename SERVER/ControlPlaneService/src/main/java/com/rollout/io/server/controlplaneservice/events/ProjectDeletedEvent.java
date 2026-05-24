package com.rollout.io.server.controlplaneservice.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

/**
 * Event payload published internally when a Project is deleted.
 * Triggers cascading deletion of all Environments belonging to the specified Project.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDeletedEvent implements Serializable {

    /**
     * The MongoDB document ID of the deleted Project.
     */
    private String projectId;

    /**
     * ISO-8601 timestamp marking when the deletion was initiated.
     */
    private Instant timestamp;

}
