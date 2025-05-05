package com.review.reviewservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties("app.ai")
public class AiProperties {

    private Provider chatgpt = new Provider();
    private Provider grok = new Provider();
    private Provider copilot = new Provider();
    private Provider gemini = new Provider();

    @Data
    public static class Provider {
        private String apiUrl;
        private String apiKey;
    }
}
