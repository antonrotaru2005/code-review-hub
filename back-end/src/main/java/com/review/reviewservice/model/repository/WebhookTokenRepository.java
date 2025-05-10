package com.review.reviewservice.model.repository;

import com.review.reviewservice.model.entity.WebhookToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WebhookTokenRepository extends JpaRepository<WebhookToken, Long> {
    Optional<WebhookToken> findByToken(String token);
}