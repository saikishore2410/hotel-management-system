package com.hms.common.exception;

/** Request is valid but conflicts with current state (room taken, bad status transition). Maps to HTTP 409. */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
