package com.hms.common.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.mapping.PropertyReferenceException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Central exception translation. Extends ResponseEntityExceptionHandler so Spring MVC's own
 * exceptions (bad JSON, wrong method, type mismatch...) also come back in the ApiError format.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex, WebRequest request) {
        return respond(HttpStatus.NOT_FOUND, ex.getMessage(), request, null);
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ApiError> handleInvalid(InvalidRequestException ex, WebRequest request) {
        return respond(HttpStatus.BAD_REQUEST, ex.getMessage(), request, null);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiError> handleConflict(ConflictException ex, WebRequest request) {
        return respond(HttpStatus.CONFLICT, ex.getMessage(), request, null);
    }

    /** Invalid ?sort= property on a pageable endpoint. */
    @ExceptionHandler(PropertyReferenceException.class)
    public ResponseEntity<ApiError> handleBadSort(PropertyReferenceException ex, WebRequest request) {
        return respond(HttpStatus.BAD_REQUEST, "Invalid sort property: " + ex.getPropertyName(), request, null);
    }

    /** Database constraint tripped (unique/foreign key) despite service-level checks. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleIntegrity(DataIntegrityViolationException ex, WebRequest request) {
        log.warn("Data integrity violation", ex);
        return respond(HttpStatus.CONFLICT, "Request conflicts with existing data", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, WebRequest request) {
        log.error("Unhandled exception", ex);
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request, null);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  HttpHeaders headers,
                                                                  HttpStatusCode status,
                                                                  WebRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        return ResponseEntity.status(status)
                .body(build(status, "Validation failed", request, fieldErrors));
    }

    /** Funnels all remaining Spring MVC exceptions into ApiError without leaking parser internals. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
                                                             HttpStatusCode statusCode, WebRequest request) {
        String message = statusCode.value() == HttpStatus.BAD_REQUEST.value()
                ? "Malformed or invalid request"
                : defaultReason(statusCode);
        return ResponseEntity.status(statusCode).headers(headers)
                .body(build(statusCode, message, request, null));
    }

    private ResponseEntity<ApiError> respond(HttpStatus status, String message, WebRequest request,
                                             Map<String, String> fieldErrors) {
        return ResponseEntity.status(status).body(build(status, message, request, fieldErrors));
    }

    private ApiError build(HttpStatusCode status, String message, WebRequest request,
                           Map<String, String> fieldErrors) {
        return new ApiError(Instant.now(), status.value(), defaultReason(status), message,
                request.getDescription(false).replaceFirst("^uri=", ""), fieldErrors);
    }

    private String defaultReason(HttpStatusCode status) {
        HttpStatus resolved = HttpStatus.resolve(status.value());
        return resolved != null ? resolved.getReasonPhrase() : "Error";
    }
}
