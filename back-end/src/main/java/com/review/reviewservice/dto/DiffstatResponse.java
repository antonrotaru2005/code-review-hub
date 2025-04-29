package com.review.reviewservice.dto;

import lombok.Data;

import java.util.List;

@Data
public class DiffstatResponse {
    private List<DiffstatEntry> values;
}
