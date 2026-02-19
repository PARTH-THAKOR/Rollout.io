package com.rollout.io.server.authservice.objects;

import lombok.Getter;

import java.time.Instant;

@Getter
public class ApiResponse<T> {

    private final String message;
    private final boolean success;
    private final Instant timestamp;
    private final T data;

    public ApiResponse(String message, boolean success, T data) {
        this.message = message;
        this.success = success;
        this.timestamp = Instant.now();
        this.data = data;
    }

}
