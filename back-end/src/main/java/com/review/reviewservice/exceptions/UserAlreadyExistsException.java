package com.review.reviewservice.exceptions;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;

public class UserAlreadyExistsException extends OAuth2AuthenticationException {
    public UserAlreadyExistsException(String message) {
        super(message);
    }
}