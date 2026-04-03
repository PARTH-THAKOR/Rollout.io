package com.rollout.io.server.controlplaneservice.exceptions;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Custom runtime exception representing an expected business logic error.
 * Exposes a specific HTTP status code for accurate client-side mapping by the Global Exception Handler.
 */
@Getter
public class RolloutError extends RuntimeException {

    private final HttpStatus status;

    public RolloutError(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

}
