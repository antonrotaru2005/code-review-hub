package com.review.reviewservice.service;

import com.review.reviewservice.config.BitbucketProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;

@Service
public class BitbucketService {
    private final WebClient webClient;
    private final BitbucketProperties properties;

    public BitbucketService(WebClient.Builder builder, BitbucketProperties properties) {
        this.properties = properties;
        this.webClient = builder
                .baseUrl("https://api.bitbucket.org/2.0")
                .defaultHeader("User Agent", "AI-Code_Review-Service")
                .build();
    }

    public String getModifiedFiles(String workspace, String repoSlug, int prId) {
        String url = String.format("/repositories/%s/%s/pullrequests/%d/diffstat", workspace, repoSlug, prId);
        String auth = properties.getUsername() + ":" + properties.getPassword();
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());

        try{
            String response = webClient.get()
                    .uri(url)
                    .header("Authorization", "Basic " + encodedAuth)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            System.out.println("Diffstat response: " + response);
            return response;
        } catch (Exception e){
            e.printStackTrace();
            return null;
        }
    }
}
