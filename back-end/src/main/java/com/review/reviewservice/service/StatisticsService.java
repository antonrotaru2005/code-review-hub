package com.review.reviewservice.service;

import com.review.reviewservice.dto.UserStatsDto;
import com.review.reviewservice.model.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class StatisticsService {
    private final FeedbackRepository feedbackRepository;

    @Autowired
    public StatisticsService(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    @Transactional(readOnly = true)
    public UserStatsDto getStatsForUser(String username) {
        int total = feedbackRepository.countByUserUsername(username);
        Double avgLenRaw = feedbackRepository.findAvgCommentLengthByUsername(username);
        double avgLen = (avgLenRaw != null ? avgLenRaw : 0);
        int repos = feedbackRepository.countDistinctReposByUsername(username);
        LocalDateTime lastAt = feedbackRepository.findLastFeedbackAtByUsername(username);
        LocalDateTime lastFeedbackAt = (lastAt != null ? lastAt : LocalDateTime.MIN);

        double avgLenRounded = Math.round(avgLen * 100.0) / 100.0;
        return new UserStatsDto(total, avgLenRounded, repos, lastFeedbackAt);
    }
}
