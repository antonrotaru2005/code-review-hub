package com.review.reviewservice.dto;

import jakarta.validation.constraints.NotEmpty;

public record ChatRequestDto(
        @NotEmpty String ai,
        @NotEmpty String model,
        @NotEmpty String message
) {}
