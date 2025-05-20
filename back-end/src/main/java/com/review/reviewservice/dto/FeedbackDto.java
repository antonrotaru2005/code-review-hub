package com.review.reviewservice.dto;

import java.time.LocalDateTime;

public record FeedbackDto(
        Long id,
        String repoFullName,
        Long prId,
        String comment,
        String model,
        LocalDateTime createdAt,
        Long userId,
        String username,
        int rate
) {}
