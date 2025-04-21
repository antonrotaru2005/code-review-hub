package com.review.reviewservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FileInfo {
    private String path;

    @JsonProperty("escaped_path")
    private String escapedPath;
}
