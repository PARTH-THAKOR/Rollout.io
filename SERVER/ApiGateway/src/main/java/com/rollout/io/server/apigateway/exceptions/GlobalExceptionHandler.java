package com.rollout.io.server.apigateway.exceptions;

import com.rollout.io.server.apigateway.helpers.ApiResponseBuilder;
import com.rollout.io.server.apigateway.objects.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RolloutError.class)
    public ResponseEntity<ApiResponse<Object>> handleRolloutError(
            RolloutError ex
    ) {
        return ApiResponseBuilder.out(
                ex.getStatus(),
                ex.getMessage(),
                null
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidation(
            MethodArgumentNotValidException ex
    ) {

        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getField() + " " + error.getDefaultMessage())
                .orElse("Validation failed");

        return ApiResponseBuilder.out(
                HttpStatus.BAD_REQUEST,
                message,
                null
        );
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex
    ) {

        return ApiResponseBuilder.out(
                HttpStatus.BAD_REQUEST,
                "Invalid value for: " + ex.getName(),
                null
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleInvalidJson(
            HttpMessageNotReadableException ex
    ) {

        return ApiResponseBuilder.out(
                HttpStatus.BAD_REQUEST,
                "Malformed JSON request "+ex.getMessage(),
                null
        );
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentials(
            BadCredentialsException ex
    ) {

        return ApiResponseBuilder.out(
                HttpStatus.UNAUTHORIZED,
                "ACCESS DENIED "+ex.getMessage(),
                null
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(
            AccessDeniedException ex
    ) {

        return ApiResponseBuilder.out(
                HttpStatus.FORBIDDEN,
                "ACCESS DENIED "+ex.getMessage(),
                null
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(
            Exception ex
    ) {

        return ApiResponseBuilder.out(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal server error "+ex.getMessage(),
                null
        );
    }

}
