package com.hms.common.exception;

/** Business-level validation failure (e.g. check-out before check-in). Maps to HTTP 400. */
public class InvalidRequestException extends RuntimeException {
    public InvalidRequestException(String message) {
        super(message);
    }
}
