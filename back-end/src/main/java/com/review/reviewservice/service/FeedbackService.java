package com.review.reviewservice.service;

import com.review.reviewservice.model.entity.Feedback;
import com.review.reviewservice.model.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FeedbackService {
    private final FeedbackRepository feedbackRepository;

    @Autowired
    public FeedbackService(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    public Feedback save(Feedback feedback) {
        return feedbackRepository.save(feedback);
    }

    public List<Feedback> getByPr(Long prId) {
        return feedbackRepository.findByPrId(prId);
    }

    public List<Feedback> getByUser(String userKey) {
        return feedbackRepository.findByUserKey(userKey);
    }
}
