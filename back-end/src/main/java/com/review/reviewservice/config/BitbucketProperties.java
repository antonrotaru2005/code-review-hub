package com.review.reviewservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "bitbucket")
public class BitbucketProperties {
    private String username;
    private String password;
}
