package com.review.reviewservice.model.repository;

import com.review.reviewservice.model.entity.AiModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiModelRepository extends JpaRepository<AiModel, Long> {
    Optional<AiModel> findByAiIgnoreCaseAndModelIgnoreCase(String ai, String model);
}