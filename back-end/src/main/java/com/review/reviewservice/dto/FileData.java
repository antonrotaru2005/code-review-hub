package com.review.reviewservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FileData {
    private String path;
    private String content;
}
