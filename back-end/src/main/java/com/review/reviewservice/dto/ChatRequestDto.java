package com.review.reviewservice.dto;

public record ChatRequestDto(
        String ai,
        String model,
        String message
) {}
