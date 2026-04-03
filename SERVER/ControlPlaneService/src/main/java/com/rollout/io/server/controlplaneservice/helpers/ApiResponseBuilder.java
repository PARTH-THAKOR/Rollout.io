package com.rollout.io.server.controlplaneservice.helpers;

import com.rollout.io.server.controlplaneservice.objects.ApiResponse;
import com.rollout.io.server.controlplaneservice.objects.Helper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * Utility helper simplifying the assembly of generic {@link ApiResponse} objects.
 * Encapsulates the boilerplate wrapper logic into a unified static mapping function.
 */
@Helper
public class ApiResponseBuilder {

    /**
     * Constructs a standardized HTTP response carrying the given payload and message.
     * Evaluates HTTP 2xx to automatically set the boolean success flag.
     *
     * @param status the formal HTTP response code
     * @param message an explicitly descriptive string for the client
     * @param data the generic payload entity attached (if any)
     * @param <T> the type of the payload being constructed
     * @return the correctly configured Spring ResponseEntity
     */
    public static <T> ResponseEntity<ApiResponse<T>> out(HttpStatus status, String message, T data) {
        boolean success = status.is2xxSuccessful();
        ApiResponse<T> response = new ApiResponse<>(message, success, data);
        return ResponseEntity.status(status).body(response);
    }

}