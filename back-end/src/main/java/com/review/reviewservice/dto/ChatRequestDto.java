package com.review.reviewservice.dto;

import java.util.List;

public record ChatRequestDto(
        String ai,
        String model,
        List<MessageDto> history
) {}
