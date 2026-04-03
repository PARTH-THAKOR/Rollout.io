package com.rollout.io.server.sdkservice.helpers;

import com.rollout.io.server.sdkservice.objects.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * Standardized utility class handling the consistent construction of JSON responses.
 * Enforces the standardized layout format universally across all client communication channels.
 */
public class ApiResponseBuilder {

    /**
     * Generates a statically typed HTTP response properly encapsulated within the standard shape.
     *
     * @param status exact HTTP classification code
     * @param message human-readable execution success string
     * @param data generalized primitive or structured literal assigned into the object stream
     * @param <T> generic literal mapping dynamically against constraints
     * @return encapsulated HTTP response mapping JSON shapes correctly
     */
    public static <T> ResponseEntity<ApiResponse<T>> out(HttpStatus status, String message, T data) {
        boolean success = status.is2xxSuccessful();
        ApiResponse<T> response = new ApiResponse<>(message, success, data);
        return new ResponseEntity<>(response, status);
    }

}
