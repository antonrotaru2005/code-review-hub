package com.review.reviewservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.review.reviewservice.config.ChatGptProperties;
import com.review.reviewservice.dto.FileData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.List;

@Slf4j
@Service
public class ChatGPTService {
    private final RestTemplate restTemplate;
    private final ChatGptProperties properties;
    private final ObjectMapper objectMapper;

    @Autowired
    public ChatGPTService(RestTemplate restTemplate, ChatGptProperties properties, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public String reviewFiles(List<FileData> files, String model) {
        try {
            if (properties.getApiUrl() == null || properties.getApiUrl().trim().isEmpty()) {
                throw new IllegalArgumentException("ChatGPT API URL is not set in configuration");
            }
            URI apiUri = URI.create(properties.getApiUrl());
            if (!apiUri.isAbsolute()) {
                throw new IllegalArgumentException("ChatGPT API URL is not absolute: " + properties.getApiUrl());
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(properties.getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model);

            ArrayNode messages = objectMapper.createArrayNode();
            ObjectNode systemMessage = objectMapper.createObjectNode();
            systemMessage.put("role", "system");
            systemMessage.put("content", "You are a highly experienced code review assistant with a strong critical thinking skills. You provide detailed and objective feedback on code, including potential bugs, improvements, and best practices.");
            messages.add(systemMessage);

            for (FileData file : files) {
                ObjectNode userMessage = objectMapper.createObjectNode();
                userMessage.put("role", "user");
                userMessage.put("content", "Review this code file (" + file.getPath() + "):\n" + file.getContent());
                messages.add(userMessage);
            }

            requestBody.set("messages", messages);

            String requestBodyString = objectMapper.writeValueAsString(requestBody);
            log.info("ChatGPT request payload: {}", requestBodyString);

            HttpEntity<String> entity = new HttpEntity<>(requestBodyString, headers);

            String response = restTemplate.exchange(apiUri, HttpMethod.POST, entity, String.class).getBody();

            JsonNode responseNode = objectMapper.readTree(response);
            if (!responseNode.has("choices") || responseNode.get("choices").isEmpty()) {
                throw new IllegalStateException("No choices found in ChatGPT response: " + response);
            }
            return responseNode.get("choices").get(0).get("message").get("content").asText();

        } catch (Exception e) {
            log.error("Error during ChatGPT review: {}", e.getMessage(), e);
            return "Error during ChatGPT review: " + e.getMessage();
        }
    }
}