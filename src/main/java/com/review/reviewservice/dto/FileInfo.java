package com.review.reviewservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FileInfo {
    private String path;

    @JsonProperty("escaped_path")
    private String escapedPath;

    private Links links;

    @Data
    public static class Links {
        private Self self;
    }

    @Data
    public static class Self {
        private String href;
    }
}

