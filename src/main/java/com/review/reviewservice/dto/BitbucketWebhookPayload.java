package com.review.reviewservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class BitbucketWebhookPayload {

    @JsonProperty("pullrequest")
    private PullRequest pullRequest;

    private Repository repository;

    @Data
    public static class PullRequest {
        private int id;
        private String title;
        private Author author;
    }

    @Data
    public static class Author {
        @JsonProperty("display_name")
        private String displayName;
    }

    @Data
    public static class Repository {
        @JsonProperty("full_name")
        private String fullName;
    }
}
