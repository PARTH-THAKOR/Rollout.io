package com.rollout.io.server.apigateway.helpers;

import com.rollout.io.server.apigateway.objects.ApiResponse;
import com.rollout.io.server.apigateway.objects.Helper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * Utility helper to construct standardized API Responses seamlessly.
 */
@Helper
public class ApiResponseBuilder {

    /**
     * Builds and wraps the data inside a Spring ResponseEntity context.
     *
     * @param <T> generic type of data payload object
     * @param status the HTTP Status of the request logic (2xx is success)
     * @param message concise message summarizing state text
     * @param data the primary JSON data or model object
     * @return structured ResponseEntity mapping HTTP format
     */
    public static <T> ResponseEntity<ApiResponse<T>> out(HttpStatus status, String message, T data) {
        boolean success = status.is2xxSuccessful();
        ApiResponse<T> response = new ApiResponse<>(message, success, data);
        return ResponseEntity.status(status).body(response);
    }

}