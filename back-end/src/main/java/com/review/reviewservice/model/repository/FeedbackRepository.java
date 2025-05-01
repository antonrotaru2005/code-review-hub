package com.review.reviewservice.model.repository;

import com.review.reviewservice.model.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByPrId(Long prId);
    List<Feedback> findByUserUsername(String username);
}
