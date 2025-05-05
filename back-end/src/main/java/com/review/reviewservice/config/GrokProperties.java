package com.review.reviewservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "grok")
public class GrokProperties {
    private String apiUrl;
    private String apiKey;
}