package com.review.reviewservice.model.repository;

import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.entity.WebhookToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WebhookTokenRepository extends JpaRepository<WebhookToken, Long> {
    Optional<WebhookToken> findByUserAndActiveTrue(User user);
    Optional<WebhookToken> findByTokenAndActiveTrue(String token);
}