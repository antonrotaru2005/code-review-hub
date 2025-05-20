package com.review.reviewservice.dto;

import java.time.LocalDateTime;

public record UserStatsDto(
        int totalFeedbacks,
        double avgCommentLength,
        int distinctRepoCount,
        LocalDateTime lastFeedbackAt,
        double avgRate
) {}
