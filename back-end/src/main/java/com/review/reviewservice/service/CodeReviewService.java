package com.review.reviewservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.review.reviewservice.config.AiProperties;
import com.review.reviewservice.dto.FileData;
import com.review.reviewservice.dto.MessageDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Slf4j
@Service
public class CodeReviewService {
    private final AiProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public CodeReviewService(AiProperties properties, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.properties = properties;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Reviews a list of files using the specified AI provider and model,
     * tailoring feedback to the given list of aspects.
     */
    public String reviewFiles(List<FileData> files, String aiName, String model, List<String> aspects) {
        if (files == null || files.isEmpty()) {
            log.warn("No files provided for review");
            return "Error: No files provided for review";
        }
        if (aspects == null || aspects.isEmpty()) {
            log.warn("No aspects provided for review");
            return "Error: No aspects provided for review";
        }

        try {
            AiProperties.Provider provider = selectProvider(aiName);
            String apiUrl = provider.getApiUrl();
            HttpHeaders headers = new HttpHeaders();
            ObjectNode body = objectMapper.createObjectNode();

            if (isGemini(aiName)) {
                apiUrl = apiUrl + "?key=" + provider.getApiKey();
                headers.setContentType(MediaType.APPLICATION_JSON);
                ArrayNode contents = buildGeminiContents(files, aspects);
                body.set("contents", contents);
                body.set("generationConfig", objectMapper.createObjectNode()
                        .put("temperature", 0.7)
                        .put("maxOutputTokens", 4096));
            } else {
                headers.setBearerAuth(provider.getApiKey());
                headers.setContentType(MediaType.APPLICATION_JSON);
                body.put("model", model);
                ArrayNode messages = objectMapper.createArrayNode();

                String dynamicPrompt = buildSystemPrompt(aspects);
                messages.add(
                        objectMapper.createObjectNode()
                                .put("role", "system")
                                .put("content", dynamicPrompt)
                );

                for (FileData file : files) {
                    if (file.getContent() == null || file.getPath() == null) {
                        log.warn("Invalid file data: {}", file);
                        continue;
                    }
                    messages.add(
                            objectMapper.createObjectNode()
                                    .put("role", "user")
                                    .put("content", "File: " + file.getPath() + "\n```java\n" + file.getContent() + "\n```")
                    );
                }
                body.set("messages", messages);
                body.put("max_tokens", 4096);
            }

            HttpEntity<String> request = new HttpEntity<>(body.toString(), headers);
            String response = restTemplate.exchange(apiUrl, HttpMethod.POST, request, String.class).getBody();
            return extractContent(response, aiName);
        } catch (Exception e) {
            log.error("Error during {} review: {}", aiName, e.getMessage(), e);
            return "Error during " + aiName + " review: " + e.getMessage();
        }
    }

    /**
     * Builds a dynamic system prompt for code review based on requested aspects,
     * plus a final “Rate” aspect (1–100%).
     */
    private String buildSystemPrompt(List<String> aspects) {
        StringBuilder sb = new StringBuilder(
                """
                You are an expert senior code reviewer specializing in Java and modern front-end development.
                Review the provided code files **only** for the following aspects, in the order listed.
                Use Markdown with clear headings and concise bullet points for each aspect.
                Focus on actionable feedback, best practices, and potential issues.
        
                """
        );
        // List user-selected aspects
        for (int i = 0; i < aspects.size(); i++) {
            sb.append("### ").append(i + 1).append(". ").append(aspects.get(i)).append("\n");
        }
        sb.append("### ")
                .append(aspects.size() + 1)
                .append(". Rate\n")
                .append("On the next line, output ONLY a single integer between 1 and 100, with no other characters.\n\n");

        sb.append("Provide specific, concise, and constructive feedback for each aspect.");
        return sb.toString();
    }

    /**
     * Builds Gemini-style contents with dynamic prompt for code review.
     */
    private ArrayNode buildGeminiContents(List<FileData> files, List<String> aspects) {
        ArrayNode contents = objectMapper.createArrayNode();
        contents.add(
                objectMapper.createObjectNode()
                        .put("role", "user")
                        .set("parts",
                                objectMapper.createArrayNode()
                                        .add(objectMapper.createObjectNode()
                                                .put("text", buildSystemPrompt(aspects))))
        );
        for (FileData file : files) {
            if (file.getContent() == null || file.getPath() == null) {
                log.warn("Invalid file data: {}", file);
                continue;
            }
            contents.add(
                    objectMapper.createObjectNode()
                            .put("role", "user")
                            .set("parts",
                                    objectMapper.createArrayNode()
                                            .add(objectMapper.createObjectNode()
                                                    .put("text", "File: " + file.getPath() + "\n```java\n" + file.getContent() + "\n```")))
            );
        }
        return contents;
    }

    /**
     * Engages in a friendly chat conversation with the specified AI model, using user context.
     */
    public String chat(String aiName, String model, List<MessageDto> history) {
        if (history == null || history.isEmpty()) {
            log.warn("No chat history provided");
            return "Error: No chat history provided";
        }

        try {
            AiProperties.Provider provider = selectProvider(aiName);
            String apiUrl = provider.getApiUrl();
            HttpHeaders headers = new HttpHeaders();
            ObjectNode body = objectMapper.createObjectNode();

            String username = SecurityContextHolder.getContext()
                    .getAuthentication()
                    .getName();
            String dynamicPrompt = String.format(
                    "You are a friendly and knowledgeable AI assistant named %s, assisting user '%s'. " +
                            "Provide helpful, concise, and engaging responses. " +
                            "Use a conversational tone and adapt to the user's context based on the chat history.",
                    aiName, username
            );

            if (isGemini(aiName)) {
                apiUrl = apiUrl + "?key=" + provider.getApiKey();
                headers.setContentType(MediaType.APPLICATION_JSON);

                ArrayNode contents = objectMapper.createArrayNode();
                contents.add(
                        objectMapper.createObjectNode()
                                .put("role", "user")
                                .set("parts",
                                        objectMapper.createArrayNode()
                                                .add(objectMapper.createObjectNode()
                                                        .put("text", dynamicPrompt)))
                );
                for (MessageDto message : history) {
                    if (message.content() == null || message.role() == null) {
                        log.warn("Invalid message data: {}", message);
                        continue;
                    }
                    contents.add(
                            objectMapper.createObjectNode()
                                    .put("role", message.role())
                                    .set("parts",
                                            objectMapper.createArrayNode()
                                                    .add(objectMapper.createObjectNode()
                                                            .put("text", message.content())))
                    );
                }
                body.set("contents", contents);
                body.set("generationConfig", objectMapper.createObjectNode()
                        .put("temperature", 0.9)
                        .put("maxOutputTokens", 2048));
            } else {
                headers.setBearerAuth(provider.getApiKey());
                headers.setContentType(MediaType.APPLICATION_JSON);
                body.put("model", model);

                ArrayNode messages = objectMapper.createArrayNode();
                messages.add(
                        objectMapper.createObjectNode()
                                .put("role", "system")
                                .put("content", dynamicPrompt)
                );
                for (MessageDto message : history) {
                    if (message.content() == null || message.role() == null) {
                        log.warn("Invalid message data: {}", message);
                        continue;
                    }
                    messages.add(
                            objectMapper.createObjectNode()
                                    .put("role", message.role())
                                    .put("content", message.content())
                    );
                }
                body.set("messages", messages);
                body.put("max_tokens", 2048);
            }

            HttpEntity<String> request = new HttpEntity<>(body.toString(), headers);
            String response = restTemplate.exchange(apiUrl, HttpMethod.POST, request, String.class).getBody();
            return extractContent(response, aiName);
        } catch (Exception e) {
            log.error("Error during {} chat: {}", aiName, e.getMessage(), e);
            return "Error during " + aiName + " chat: " + e.getMessage();
        }
    }

    private AiProperties.Provider selectProvider(String aiName) {
        if (aiName == null) {
            throw new IllegalArgumentException("AI name must not be null");
        }
        return switch (aiName.toLowerCase()) {
            case "chatgpt" -> properties.getChatgpt();
            case "grok"    -> properties.getGrok();
            case "copilot" -> properties.getCopilot();
            case "gemini"  -> properties.getGemini();
            default -> throw new IllegalArgumentException("Unknown AI: " + aiName);
        };
    }

    private boolean isGemini(String aiName) {
        return "gemini".equalsIgnoreCase(aiName);
    }

    /**
     * Extracts content from the AI response based on the provider.
     */
    private String extractContent(String response, String aiName) throws Exception {
        if (response == null) {
            throw new IllegalStateException("Empty response from " + aiName);
        }
        JsonNode respNode = objectMapper.readTree(response);
        if (isGemini(aiName)) {
            JsonNode candidates = respNode.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new IllegalStateException("Invalid response from Gemini: " + response);
            }
            JsonNode content = candidates.get(0).path("content").path("parts").get(0).path("text");
            return content.isMissingNode() ? "No content returned" : content.asText();
        } else {
            JsonNode choices = respNode.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                throw new IllegalStateException("Invalid response from " + aiName + ": " + response);
            }
            JsonNode content = choices.get(0).path("message").path("content");
            return content.isMissingNode() ? "No content returned" : content.asText();
        }
    }
}