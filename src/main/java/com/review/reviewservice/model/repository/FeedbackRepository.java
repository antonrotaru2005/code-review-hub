package com.review.reviewservice.model.repository;

import com.review.reviewservice.model.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByPrId(Long prId);
    List<Feedback> findByUserKey(String userKey);
}
