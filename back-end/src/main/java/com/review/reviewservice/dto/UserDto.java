package com.review.reviewservice.dto;

import java.util.List;

/**
 * Data Transfer Object pentru informații despre utilizator autentificat.
 */
public record UserDto(
        String username,
        String name,
        String email,
        String avatar,
        String aiModel,
        List<String> roles
) {}
