package com.review.reviewservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class InlineComment {
    private String path;
    private int lineNumber;
    private String comment;
}