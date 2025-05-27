package com.review.reviewservice.dto;

import com.review.reviewservice.model.entity.AiModel;

import java.util.List;

/**
 * Data Transfer Object pentru informații despre utilizator autentificat.
 */
public record UserDto(
        String username,
        String name,
        String email,
        String avatar,
        AiModel aiModel,
        List<String> roles,
        List<String> teamNames
) {}
