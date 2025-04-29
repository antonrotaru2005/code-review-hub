package com.review.reviewservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class DiffstatEntry {

    @JsonProperty("lines_added")
    private int linesAdded;

    @JsonProperty("lines_removed")
    private int linesRemoved;

    private String status;

    @JsonProperty("new")
    private FileInfo _new;

    private FileInfo old;
}
