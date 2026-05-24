package com.rollout.io.server.authservice.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

/**
 * Event payload published to RabbitMQ when a user account is permanently deleted.
 * ControlPlaneService consumes this event to cascade-delete all associated
 * Projects, Environments, Flags, and AuditLogs owned by the departing user.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDeletedEvent implements Serializable {

    /**
     * The Firebase UID of the deleted user, used by ControlPlaneService
     * to locate and purge all resources owned by this identity.
     */
    private String uid;

    /**
     * ISO-8601 timestamp marking when the deletion was initiated.
     */
    private Instant timestamp;

}
