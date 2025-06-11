package com.review.reviewservice.exceptions;

public class TeamAlreadyExistsException extends RuntimeException {
    public TeamAlreadyExistsException(String message) {
        super(message);
    }
}
