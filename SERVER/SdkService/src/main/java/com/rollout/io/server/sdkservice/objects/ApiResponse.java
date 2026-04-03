package com.rollout.io.server.sdkservice.objects;

import lombok.Getter;

import java.time.Instant;

/**
 * Standardized API Response wrapper object.
 * Encapsulates the core JSON structure uniformly returned by all platform endpoints.
 *
 * @param <T> the type parameter representing the inner payload data structure
 */
@Getter
public class ApiResponse<T> {

    private final String message;
    private final boolean success;
    private final Instant timestamp;
    private final T data;

    /**
     * Instantiates a fully populated generic response structure.
     *
     * @param message human-readable summary of the execution outcome
     * @param success execution success indicator mapped from HTTP status blocks
     * @param data the operational payload sent down to the client
     */
    public ApiResponse(String message, boolean success, T data) {
        this.message = message;
        this.success = success;
        this.timestamp = Instant.now();
        this.data = data;
    }

}
