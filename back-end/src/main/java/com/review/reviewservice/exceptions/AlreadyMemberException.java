package com.review.reviewservice.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class AlreadyMemberException extends RuntimeException {
    public AlreadyMemberException(String username) {
        super(username + " is already a member");
    }
}

