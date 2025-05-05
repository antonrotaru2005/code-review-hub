package com.review.reviewservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.review.reviewservice.config.AiProperties;
import com.review.reviewservice.dto.FileData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Slf4j
@Service
public class CodeReviewService {
    private final AiProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private static final String SYSTEM_PROMPT = "You are a highly experienced code review assistant with a strong critical thinking skills. You provide detailed and objective feedback on code, including potential bugs, improvements, and best practices.";

    public CodeReviewService(AiProperties properties,
                             RestTemplate restTemplate,
                             ObjectMapper objectMapper) {
        this.properties = properties;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public String reviewFiles(List<FileData> files, String aiName, String model) {
        try{
            AiProperties.Provider p = switch (aiName.toLowerCase()) {
                case "chatgpt" -> properties.getChatgpt();
                case "grok"    -> properties.getGrok();
                default -> throw new IllegalArgumentException("AI necunoscut: " + aiName);
            };

            if (p.getApiUrl() == null || p.getApiUrl().isBlank())
                throw new IllegalStateException("API URL nu e configurat pentru " + aiName);

            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);

            ArrayNode messages = objectMapper.createArrayNode();
            messages.add(objectMapper.createObjectNode()
                    .put("role", "system")
                    .put("content", SYSTEM_PROMPT));

            for (FileData f : files) {
                messages.add(objectMapper.createObjectNode()
                        .put("role", "user")
                        .put("content", "Review this code file (" + f.getPath() + "):\n" + f.getContent()));
            }
            body.set("messages", messages);

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(p.getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> req = new HttpEntity<>(body.toString(), headers);

            String resp = restTemplate.exchange(p.getApiUrl(), HttpMethod.POST, req, String.class).getBody();

            JsonNode choices = objectMapper.readTree(resp).path("choices");
            if (!choices.isArray() || choices.isEmpty())
                throw new IllegalStateException("Răspuns invalid de la " + aiName + ": " + resp);

            return choices.get(0).path("message").path("content").asText();
        } catch (Exception e) {
            log.error("Error during {} review: {}", aiName, e.getMessage(), e);
            return "Error during " + aiName + " review: " + e.getMessage();
        }
    }
}
