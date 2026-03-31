package com.rollout.io.server.apigateway.exceptions;

import com.rollout.io.server.apigateway.helpers.ApiResponseBuilder;
import com.rollout.io.server.apigateway.objects.ApiResponse;
import org.springframework.beans.TypeMismatchException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ServerWebInputException;

/**
 * Global centralized Exception Handler to intercept and format Controller level exceptions.
 * Always resolves to a clean JSON API Response object instead of default ugly server traces.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles custom defined RolloutError exceptions.
     *
     * @param ex the intercepted RolloutError object
     * @return the formatted JSON API Response mapping
     */
    @ExceptionHandler(RolloutError.class)
    public ResponseEntity<ApiResponse<Object>> handleRolloutError(RolloutError ex) {
        return ApiResponseBuilder.out(ex.getStatus(), ex.getMessage(), null);
    }

    /**
     * Intercepts validations issues mapping bad payload arguments.
     *
     * @param ex the intercepted argument validation fault
     * @return BAD_REQUEST mappings detailing missing/invalid fields
     */
    @ExceptionHandler(WebExchangeBindException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidation(WebExchangeBindException ex) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getField() + " " + error.getDefaultMessage())
                .orElse("Validation failed");

        return ApiResponseBuilder.out(HttpStatus.BAD_REQUEST, message, null);
    }

    /**
     * Intercepts mismatch payload arguments dynamically cast.
     *
     * @param ex the mismatch error thrown
     * @return BAD_REQUEST identifying invalid map parsing
     */
    @ExceptionHandler(TypeMismatchException.class)
    public ResponseEntity<ApiResponse<Object>> handleTypeMismatch(TypeMismatchException ex) {
        return ApiResponseBuilder.out(HttpStatus.BAD_REQUEST, "Invalid value for property: " + ex.getPropertyName(), null);
    }

    /**
     * Intercepts malformed JSON parsing errors during deserialization payload chunks.
     *
     * @param ex JSON stream invalid format exception
     * @return BAD_REQUEST syntax parsing fault
     */
    @ExceptionHandler(ServerWebInputException.class)
    public ResponseEntity<ApiResponse<Object>> handleInvalidJson(ServerWebInputException ex) {
        return ApiResponseBuilder.out(HttpStatus.BAD_REQUEST, "Malformed request: " + ex.getReason(), null);
    }

    /**
     * Intercepts authentication or invalid principal token accesses.
     *
     * @param ex the bad credentials exception wrapper
     * @return UNAUTHORIZED message with reasons outlined
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentials(BadCredentialsException ex) {
        return ApiResponseBuilder.out(HttpStatus.UNAUTHORIZED, "ACCESS DENIED: " + ex.getMessage(), null);
    }

    /**
     * Intercepts users who don't have privileges or scope context.
     *
     * @param ex Access Denied permission trace context
     * @return FORBIDDEN message rejecting explicit access
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        return ApiResponseBuilder.out(HttpStatus.FORBIDDEN, "ACCESS DENIED: " + ex.getMessage(), null);
    }

    /**
     * The primary fallback runtime issue interceptor to catch everything else properly.
     *
     * @param ex the exception stack trace
     * @return INTERNAL_SERVER_ERROR stack fault context.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        return ApiResponseBuilder.out(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error: " + ex.getMessage(), null);
    }

}
