package com.review.reviewservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class BitbucketWebhookPayload {

    @JsonProperty("pullrequest")
    private PullRequest pullRequest;

    private Repository repository;

    @Data
    public static class PullRequest {
        private long id;
        private String title;
        private Author author;
        private Links links;
    }

    @Data
    public static class Links {
        private Link diffstat;
    }

    @Data
    public static class Link {
        private String href;
    }

    @Data
    public static class Author {
        @JsonProperty("display_name")
        private String displayName;
        private String uuid;
    }

    @Data
    public static class Repository {
        @JsonProperty("full_name")
        private String fullName;
    }
}
