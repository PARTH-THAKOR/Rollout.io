package com.rollout.io.server.controlplaneservice.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

/**
 * Event payload consumed from RabbitMQ when a user account is permanently deleted.
 * Triggers cascading deletion of all Projects owned by the specified Firebase UID.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDeletedEvent implements Serializable {

    /**
     * The Firebase UID of the deleted user.
     */
    private String uid;

    /**
     * ISO-8601 timestamp marking when the deletion was initiated.
     */
    private Instant timestamp;

}
