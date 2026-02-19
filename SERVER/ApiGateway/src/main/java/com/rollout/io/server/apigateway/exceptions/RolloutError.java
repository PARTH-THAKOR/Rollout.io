package com.rollout.io.server.apigateway.exceptions;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class RolloutError extends RuntimeException {

    private final HttpStatus status;

    public RolloutError(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

}
