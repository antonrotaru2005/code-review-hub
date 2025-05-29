package com.review.reviewservice.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class WrongTeamPasswordException extends RuntimeException {
    public WrongTeamPasswordException() {
        super("Incorrect team password");
    }
}