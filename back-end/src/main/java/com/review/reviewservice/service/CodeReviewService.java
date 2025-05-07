package com.review.reviewservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.review.reviewservice.config.AiProperties;
import com.review.reviewservice.dto.FileData;
import com.review.reviewservice.dto.MessageDto;
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
    private static final String SYSTEM_PROMPT = "You are a highly experienced code review assistant with strong critical thinking skills. Provide detailed and objective feedback on code, including potential bugs, improvements, and best practices.";
    private static final String CHAT_PROMPT = "You are a helpful conversational AI assistant.";

    public CodeReviewService(AiProperties properties,
                             RestTemplate restTemplate,
                             ObjectMapper objectMapper) {
        this.properties = properties;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Reviews a list of files using the specified AI provider and model.
     */
    public String reviewFiles(List<FileData> files, String aiName, String model) {
        try {
            AiProperties.Provider p = selectProvider(aiName);
            String apiUrl = p.getApiUrl();
            HttpHeaders headers = new HttpHeaders();
            ObjectNode body = objectMapper.createObjectNode();

            if (isGemini(aiName)) {
                apiUrl = apiUrl + "?key=" + p.getApiKey();
                headers.setContentType(MediaType.APPLICATION_JSON);
                ArrayNode contents = buildGeminiContents(files);
                body.set("contents", contents);
                body.set("generationConfig", objectMapper.createObjectNode().put("temperature", 0.7));
            } else {
                headers.setBearerAuth(p.getApiKey());
                headers.setContentType(MediaType.APPLICATION_JSON);
                body.put("model", model);
                ArrayNode messages = objectMapper.createArrayNode();
                messages.add(objectMapper.createObjectNode().put("role", "system").put("content", SYSTEM_PROMPT));
                for (FileData f : files) {
                    messages.add(objectMapper.createObjectNode()
                            .put("role", "user")
                            .put("content", "Review code file (" + f.getPath() + "):\n" + f.getContent()));
                }
                body.set("messages", messages);
            }

            HttpEntity<String> req = new HttpEntity<>(body.toString(), headers);
            String resp = restTemplate.exchange(apiUrl, HttpMethod.POST, req, String.class).getBody();
            return extractContent(resp, aiName);
        } catch (Exception e) {
            log.error("Error during {} review: {}", aiName, e.getMessage(), e);
            return "Error during " + aiName + " review: " + e.getMessage();
        }
    }

    /**
     * Engages in a chat conversation with the specified AI model.
     */
    public String chat(String aiName, String model, List<MessageDto> history) {
        try {
            AiProperties.Provider p = selectProvider(aiName);
            String apiUrl = p.getApiUrl();
            HttpHeaders headers = new HttpHeaders();
            ObjectNode body = objectMapper.createObjectNode();

            if (isGemini(aiName)) {
                // Gemini-style history
                apiUrl = apiUrl + "?key=" + p.getApiKey();
                headers.setContentType(MediaType.APPLICATION_JSON);

                ArrayNode contents = objectMapper.createArrayNode();
                // system prompt
                contents.add(
                        objectMapper.createObjectNode()
                                .put("role", "user")
                                .set("parts",
                                        objectMapper.createArrayNode()
                                                .add(objectMapper.createObjectNode().put("text", CHAT_PROMPT)))
                );
                // replay history
                for (MessageDto m : history) {
                    contents.add(
                            objectMapper.createObjectNode()
                                    .put("role", m.role())
                                    .set("parts",
                                            objectMapper.createArrayNode()
                                                    .add(objectMapper.createObjectNode().put("text", m.content())))
                );
                }
                body.set("contents", contents);
                body.set("generationConfig",
                        objectMapper.createObjectNode().put("temperature", 0.7));

            } else {
                // OpenAI/ChatGPT style with full history
                headers.setBearerAuth(p.getApiKey());
                headers.setContentType(MediaType.APPLICATION_JSON);

                body.put("model", model);
                ArrayNode messages = objectMapper.createArrayNode();
                // system prompt
                messages.add(
                        objectMapper.createObjectNode()
                                .put("role", "system")
                                .put("content", CHAT_PROMPT)
                );
                // user + assistant turns
                for (MessageDto m : history) {
                    messages.add(
                            objectMapper.createObjectNode()
                                    .put("role", m.role())
                                    .put("content", m.content())
                    );
                }
                body.set("messages", messages);
            }

            HttpEntity<String> req = new HttpEntity<>(body.toString(), headers);
            String resp = restTemplate
                    .exchange(apiUrl, HttpMethod.POST, req, String.class)
                    .getBody();

            return extractContent(resp, aiName);

        } catch (Exception e) {
            log.error("Error during {} chat: {}", aiName, e.getMessage(), e);
            return "Error during " + aiName + " chat: " + e.getMessage();
        }
    }

    private AiProperties.Provider selectProvider(String aiName) {
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

    private ArrayNode buildGeminiContents(List<FileData> files) {
        ArrayNode contents = objectMapper.createArrayNode();
        contents.add(objectMapper.createObjectNode()
                .put("role", "user")
                .set("parts", objectMapper.createArrayNode()
                        .add(objectMapper.createObjectNode().put("text", CodeReviewService.SYSTEM_PROMPT))));
        for (FileData f : files) {
            contents.add(objectMapper.createObjectNode()
                    .put("role", "user")
                    .set("parts", objectMapper.createArrayNode()
                            .add(objectMapper.createObjectNode().put("text", "Review code file (" + f.getPath() + "):\n" + f.getContent()))));
        }
        return contents;
    }

    private String extractContent(String resp, String aiName) throws Exception {
        JsonNode respNode = objectMapper.readTree(resp);
        if (isGemini(aiName)) {
            JsonNode candidates = respNode.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty())
                throw new IllegalStateException("Invalid response from Gemini: " + resp);
            return candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        } else {
            JsonNode choices = respNode.path("choices");
            if (!choices.isArray() || choices.isEmpty())
                throw new IllegalStateException("Invalid response from " + aiName + ": " + resp);
            return choices.get(0).path("message").path("content").asText();
        }
    }
}
