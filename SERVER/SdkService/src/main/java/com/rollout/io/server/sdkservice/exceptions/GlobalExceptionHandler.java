package com.rollout.io.server.sdkservice.exceptions;

import com.rollout.io.server.sdkservice.helpers.ApiResponseBuilder;
import com.rollout.io.server.sdkservice.objects.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import lombok.extern.slf4j.Slf4j;

/**
 * Global centralized Exception Handler to intercept and format Controller level exceptions.
 * Always resolves to a clean JSON API Response object instead of default ugly server traces.
 */
@Slf4j
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
        log.warn("RolloutError triggered: Status {} | Message: {}", ex.getStatus(), ex.getMessage());
        return ApiResponseBuilder.out(ex.getStatus(), ex.getMessage(), null);
    }

    /**
     * Intercepts validation issues mapping bad payload arguments.
     *
     * @param ex the intercepted argument validation fault
     * @return BAD_REQUEST mappings detailing missing/invalid fields
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getField() + " " + error.getDefaultMessage())
                .orElse("Validation failed");

        log.warn("Validation failed: {}", message);

        return ApiResponseBuilder.out(HttpStatus.BAD_REQUEST, message, null);
    }

    /**
     * Intercepts missing required request parameter errors.
     *
     * @param ex the missing parameter exception
     * @return BAD_REQUEST identifying the missing parameter name
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Object>> handleMissingParam(MissingServletRequestParameterException ex) {
        return ApiResponseBuilder.out(HttpStatus.BAD_REQUEST, "Missing parameter: " + ex.getParameterName(), null);
    }

    /**
     * Intercepts method argument type mismatch parsing errors.
     *
     * @param ex the type mismatch exception
     * @return BAD_REQUEST identifying the invalid property
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ApiResponseBuilder.out(HttpStatus.BAD_REQUEST, "Invalid value for: " + ex.getName(), null);
    }

    /**
     * Intercepts malformed JSON parsing errors during deserialization.
     *
     * @param ex JSON stream invalid format exception
     * @return BAD_REQUEST syntax parsing fault
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleInvalidJson(HttpMessageNotReadableException ex) {
        return ApiResponseBuilder.out(HttpStatus.BAD_REQUEST, "Malformed JSON request " + ex.getMessage(), null);
    }

    /**
     * Intercepts authentication or invalid credential token accesses.
     *
     * @param ex the bad credentials exception wrapper
     * @return UNAUTHORIZED message with reasons outlined
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentials(BadCredentialsException ex) {
        return ApiResponseBuilder.out(HttpStatus.UNAUTHORIZED, "ACCESS DENIED [INVALID AUTHENTICATION CREDENTIALS] " + ex.getMessage(), null);
    }

    /**
     * Intercepts users who don't have privileges or scope context.
     *
     * @param ex Access Denied permission trace context
     * @return FORBIDDEN message rejecting explicit access
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        return ApiResponseBuilder.out(HttpStatus.FORBIDDEN, "ACCESS DENIED " + ex.getMessage(), null);
    }

    /**
     * Intercepts all unhandled internal server exceptions.
     *
     * @param ex the unhandled Exception
     * @return INTERNAL_SERVER_ERROR generic fallback boundary
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        log.error("Internal server error encountered: ", ex);
        return ApiResponseBuilder.out(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error: " + ex.getMessage(), null);
    }

}
