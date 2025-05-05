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
        try {
            AiProperties.Provider p = switch (aiName.toLowerCase()) {
                case "chatgpt" -> properties.getChatgpt();
                case "grok" -> properties.getGrok();
                case "copilot" -> properties.getCopilot();
                case "gemini" -> properties.getGemini();
                default -> throw new IllegalArgumentException("Unknown AI: " + aiName);
            };

            if (p.getApiUrl() == null || p.getApiUrl().isBlank())
                throw new IllegalStateException("API URL is not configured for " + aiName);

            String apiUrl = p.getApiUrl();
            HttpHeaders headers = new HttpHeaders();

            ObjectNode body = objectMapper.createObjectNode();

            // Authentication and request format depending on AI
            if (aiName.equalsIgnoreCase("gemini")) {
                // Gemini uses the API key as a query parameter
                apiUrl = p.getApiUrl() + "?key=" + p.getApiKey();
                headers.setContentType(MediaType.APPLICATION_JSON);

                // Specific request format for Gemini
                ArrayNode contents = objectMapper.createArrayNode();
                contents.add(objectMapper.createObjectNode()
                        .put("role", "user")
                        .set("parts", objectMapper.createArrayNode()
                                .add(objectMapper.createObjectNode()
                                        .put("text", SYSTEM_PROMPT))));

                for (FileData f : files) {
                    contents.add(objectMapper.createObjectNode()
                            .put("role", "user")
                            .set("parts", objectMapper.createArrayNode()
                                    .add(objectMapper.createObjectNode()
                                            .put("text", "Review this code file (" + f.getPath() + "):\n" + f.getContent()))));
                }
                body.set("contents", contents);
                body.set("generationConfig", objectMapper.createObjectNode().put("temperature", 0.7));
            } else {
                // OpenAI-compatible format (ChatGPT, Grok, Copilot)
                headers.setBearerAuth(p.getApiKey());
                headers.setContentType(MediaType.APPLICATION_JSON);

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
            }

            HttpEntity<String> req = new HttpEntity<>(body.toString(), headers);
            String resp = restTemplate.exchange(apiUrl, HttpMethod.POST, req, String.class).getBody();
            JsonNode respNode = objectMapper.readTree(resp);

            // Response processing depending on AI
            String content;
            if (aiName.equalsIgnoreCase("gemini")) {
                JsonNode candidates = respNode.path("candidates");
                if (!candidates.isArray() || candidates.isEmpty())
                    throw new IllegalStateException("Invalid response from Gemini: " + resp);
                content = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
            } else {
                JsonNode choices = respNode.path("choices");
                if (!choices.isArray() || choices.isEmpty())
                    throw new IllegalStateException("Invalid response from " + aiName + ": " + resp);
                content = choices.get(0).path("message").path("content").asText();
            }

            return content;
        } catch (Exception e) {
            log.error("Error during {} review: {}", aiName, e.getMessage(), e);
            return "Error during " + aiName + " review: " + e.getMessage();
        }
    }
}
