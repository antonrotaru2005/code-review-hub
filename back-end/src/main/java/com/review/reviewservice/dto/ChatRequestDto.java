package com.review.reviewservice.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ChatRequestDto(
        @NotEmpty String ai,
        @NotEmpty String model,
        @NotEmpty List<MessageDto> history
) {}
