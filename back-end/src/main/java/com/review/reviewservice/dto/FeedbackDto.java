package com.review.reviewservice.dto;

import java.time.LocalDateTime;

public record FeedbackDto(
        Long id,
        Long prId,
        String comment,
        LocalDateTime createdAt,
        Long userId,
        String username
) {}
