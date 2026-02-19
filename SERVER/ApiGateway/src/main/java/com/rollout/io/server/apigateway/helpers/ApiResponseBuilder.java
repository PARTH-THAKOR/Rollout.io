package com.rollout.io.server.apigateway.helpers;

import com.rollout.io.server.apigateway.objects.ApiResponse;
import com.rollout.io.server.apigateway.objects.Helper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Helper
public class ApiResponseBuilder {

    public static <T> ResponseEntity<ApiResponse<T>> out(HttpStatus status, String message, T data) {
        boolean success = status.is2xxSuccessful();
        ApiResponse<T> response = new ApiResponse<>(message, success, data);
        return ResponseEntity.status(status).body(response);
    }

}