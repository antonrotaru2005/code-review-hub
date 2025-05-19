package com.review.reviewservice.model.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(name = "bitbucket_uuid", unique = true, nullable = false)
    private String bitbucketUuid;

    @Column(unique = true)
    private String email;

    @Column
    private String name;

    @Column
    private String avatar;

    private boolean enabled;

    @ManyToMany
    @JoinTable(
            name="user_roles",
            joinColumns=@JoinColumn(name="user_id"),
            inverseJoinColumns=@JoinColumn(name="role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ai_model_id")
    private AiModel aiModel;

    @Column(name = "review_aspects", columnDefinition = "TEXT", nullable = false)
    private String reviewAspects;

    /** Helper: get as List<String> */
    public List<String> getReviewAspectsList() {
        return Arrays.stream(reviewAspects.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    /** Helper: store from List<String> */
    public void setReviewAspectsList(List<String> aspects) {
        this.reviewAspects = String.join(",", aspects);
    }
}