package com.review.reviewservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.review.reviewservice.config.BitbucketProperties;
import com.review.reviewservice.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class BitbucketService {

    private final RestTemplate restTemplate;
    private final BitbucketProperties properties;
    private final ObjectMapper objectMapper;

    @Autowired
    public BitbucketService(RestTemplate restTemplate, BitbucketProperties properties) {
        this.restTemplate = restTemplate;
        this.properties = properties;
        this.objectMapper = new ObjectMapper();
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
                for (DiffstatEntry entry : response.getBody().getValues()) {
                    FileInfo file = entry.getNewFile();
                    if (file != null && file.getPath() != null) {
                        String fileContentUrl = file.getLinks().getSelf().getHref();
                        ResponseEntity<String> contentResponse = restTemplate.exchange(
                                URI.create(fileContentUrl), HttpMethod.GET, request, String.class
                        );

                        files.add(new FileData(file.getPath(), contentResponse.getBody()));
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error on extracting modified files from PR: {}", e.getMessage(), e);
        }

        return files;
    }

    public void postCommentToPullRequest(BitbucketWebhookPayload payload, String comment) {
        try {
            String commentUrl = String.format("https://api.bitbucket.org/2.0/repositories/%s/pullrequests/%s/comments",
                    payload.getRepository().getFullName(), payload.getPullRequest().getId());

            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(properties.getUsername(), properties.getPassword());
            headers.set("Content-Type", "application/json");

            ObjectNode commentPayload = objectMapper.createObjectNode();
            ObjectNode contentNode = objectMapper.createObjectNode();
            contentNode.put("raw", comment);
            commentPayload.set("content", contentNode);

            String commentPayloadString = objectMapper.writeValueAsString(commentPayload);
            log.info("Bitbucket comment payload: {}", commentPayloadString);

            HttpEntity<String> entity = new HttpEntity<>(commentPayloadString, headers);

            restTemplate.exchange(commentUrl, HttpMethod.POST, entity, String.class);
        } catch (Exception e) {
            log.error("Error posting comment to PR: {}", e.getMessage(), e);
        }
    }
}