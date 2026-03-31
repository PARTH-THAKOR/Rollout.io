package com.rollout.io.server.apigateway.objects;

import lombok.Getter;

import java.time.Instant;

/**
 * Universal JSON format structure for all API replies.
 * Standardizes microservice communication ensuring all responses
 * map consistently with trace parameters and generic payloads.
 *
 * @param <T> generic class type of injected payload
 */
@Getter
public class ApiResponse<T> {

    private final String message;
    private final boolean success;
    private final Instant timestamp;
    private final T data;

    /**
     * Instantiates a new structured API JSON response.
     *
     * @param message human-readable summary of what happened
     * @param success boolean true if the logic block passed without error
     * @param data payload wrapped into the response logic
     */
    public ApiResponse(String message, boolean success, T data) {
        this.message = message;
        this.success = success;
        this.timestamp = Instant.now();
        this.data = data;
    }

}
