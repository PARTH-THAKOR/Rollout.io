package com.rollout.io.server.apigateway.exceptions;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Custom exception model to safely capture business logic errors
 * and transform them into predictable HTTP status structures.
 */
@Getter
public class RolloutError extends RuntimeException {

    private final HttpStatus status;

    /**
     * Instantiates a new Rollout Error.
     *
     * @param message human-readable error description context
     * @param status the exact HTTP Status mapping
     */
    public RolloutError(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

}
