package com.review.reviewservice.model.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "ai_models")
@Data
public class AiModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String ai;

    @Column(nullable = false)
    private String model;
}
