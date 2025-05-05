package com.review.reviewservice.dto;

/**
 * Data Transfer Object pentru informații despre utilizator autentificat.
 */
public record UserDto(
        String username,
        String name,
        String email,
        String avatar,
        String aiModel
) {}
