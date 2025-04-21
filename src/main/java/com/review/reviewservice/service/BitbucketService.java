package com.review.reviewservice.service;

import com.review.reviewservice.config.BitbucketProperties;
import com.review.reviewservice.dto.BitbucketWebhookPayload;
import com.review.reviewservice.dto.DiffstatEntry;
import com.review.reviewservice.dto.DiffstatResponse;
import com.review.reviewservice.dto.FileInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class BitbucketService {

    private final RestTemplate restTemplate;

    private final BitbucketProperties properties;

    @Autowired
    public BitbucketService(RestTemplate restTemplate, BitbucketProperties properties) {
        this.restTemplate = restTemplate;
        this.properties = properties;
    }


    public void getModifiedFiles(BitbucketWebhookPayload payload) {
        try {
            // 1. Cream link-ul catre Diffstat
            String href = payload.getPullRequest().getLinks().getDiffstat().getHref();

            URI diffstatUrl = new URI(href);

            // 2. Header pentru autentificare Basic
            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(properties.getUsername(), properties.getPassword());
            HttpEntity<Void> request = new HttpEntity<>(headers);

            // 3. Trimitem cererea
            ResponseEntity<DiffstatResponse> response = restTemplate.exchange(
                    diffstatUrl,
                    HttpMethod.GET,
                    request,
                    DiffstatResponse.class
            );

            // 4. Procesăm răspunsul
            DiffstatResponse body = response.getBody();
            if (body != null && body.getValues() != null) {
                System.out.println("Fișiere modificate:");
                for (DiffstatEntry entry : body.getValues()) {
                    FileInfo file = entry.get_new(); // "new" e cuvânt cheie Java, deci DTO-ul tău e corect
                    if (file != null && file.getPath() != null) {
                        System.out.println(" - " + file.getPath());
                    }
                }
            } else {
                System.out.println("⚠Răspunsul nu conține fișiere modificate.");
            }

        } catch (Exception e) {
            System.err.println("Eroare la extragerea fișierelor din PR: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
