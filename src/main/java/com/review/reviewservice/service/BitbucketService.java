package com.review.reviewservice.service;

import com.review.reviewservice.config.BitbucketProperties;
import com.review.reviewservice.dto.*;
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
import java.util.ArrayList;
import java.util.List;
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

    public List<FileData> getModifiedFiles(BitbucketWebhookPayload payload) {
        List<FileData> files = new ArrayList<>();
        try {
            String diffstatHref = payload.getPullRequest().getLinks().getDiffstat().getHref();
            URI diffstatUrl = new URI(diffstatHref);

            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(properties.getUsername(), properties.getPassword());
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<DiffstatResponse> response = restTemplate.exchange(
                    diffstatUrl, HttpMethod.GET, request, DiffstatResponse.class
            );

            if (response.getBody() != null && response.getBody().getValues() != null) {
                for(DiffstatEntry entry : response.getBody().getValues()) {
                    FileInfo file = entry.get_new();
                    if(file != null && file.getPath() != null) {
                        String fileContentUrl = file.getLinks().getSelf().getHref();
                        ResponseEntity<String> contentResponse = restTemplate.exchange(
                                URI.create(fileContentUrl), HttpMethod.GET, request, String.class
                        );

                        files.add(new FileData(file.getPath(), contentResponse.getBody()));
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Eroare la extragerea fișierelor din PR: " + e.getMessage());
            e.printStackTrace();
        }

        return files;
    }
}
