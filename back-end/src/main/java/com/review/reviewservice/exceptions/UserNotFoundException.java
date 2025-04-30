package com.review.reviewservice.exceptions;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;

public class UserNotFoundException extends OAuth2AuthenticationException {
    public UserNotFoundException(String message) {
        super(message);
    }
}