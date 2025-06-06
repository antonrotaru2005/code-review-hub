package com.review.reviewservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.review.reviewservice.config.AiProperties;
import com.review.reviewservice.dto.FileData;
import com.review.reviewservice.dto.InlineComment;
import com.review.reviewservice.dto.MessageDto;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

/**
 * Custom exception for CodeReviewService errors.
 */
class CodeReviewServiceException extends RuntimeException {
    public CodeReviewServiceException(String message) {
        super(message);
    }

    public CodeReviewServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}

@Slf4j
@Service
public class CodeReviewService {
    private final AiProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private static final String CONTENT_KEY = "content";
    private static final String PARTS_KEY = "parts";

    @Autowired
    public CodeReviewService(AiProperties properties, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.properties = properties;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
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
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            String dynamicPrompt = String.format(
                    "You are a friendly and knowledgeable AI assistant named %s, assisting user '%s'. " +
                            "Provide helpful, concise, and engaging responses. " +
                            "Use a conversational tone and adapt to the user's context based on the chat history.",
                    aiName, username
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            ObjectNode body = objectMapper.createObjectNode();
            String apiUrl = provider.getApiUrl();

            if (isGemini(aiName)) {
                apiUrl = apiUrl + "?key=" + provider.getApiKey();
                buildGeminiRequestBody(body, dynamicPrompt, history);
            } else {
                headers.setBearerAuth(provider.getApiKey());
                buildDefaultRequestBody(body, model, dynamicPrompt, history);
            }

            HttpEntity<String> request = new HttpEntity<>(body.toString(), headers);
            String response = restTemplate.exchange(apiUrl, HttpMethod.POST, request, String.class).getBody();
            return extractContent(response, aiName);
        } catch (CodeReviewServiceException e) {
            log.error("Error during {} chat: {}", aiName, e.getMessage(), e);
            return "Error during " + aiName + " chat: " + e.getMessage();
        }
    }

    private void buildGeminiRequestBody(ObjectNode body, String dynamicPrompt, List<MessageDto> history) {
        ArrayNode contents = objectMapper.createArrayNode();
        addSystemMessageForGemini(contents, dynamicPrompt);
        addHistoryMessagesForGemini(contents, history);
        body.set("contents", contents);
        body.set("generationConfig", objectMapper.createObjectNode()
                .put("temperature", 0.9)
                .put("maxOutputTokens", 2048));
    }

    private void buildDefaultRequestBody(ObjectNode body, String model, String dynamicPrompt, List<MessageDto> history) {
        ArrayNode messages = objectMapper.createArrayNode();
        messages.add(
                objectMapper.createObjectNode()
                        .put("role", "system")
                        .put(CONTENT_KEY, dynamicPrompt)
        );
        addHistoryMessages(messages, history);
        body.set("messages", messages);
        body.put("model", model);
        body.put("max_tokens", 2048);
    }

    private void addSystemMessageForGemini(ArrayNode contents, String dynamicPrompt) {
        contents.add(
                objectMapper.createObjectNode()
                        .put("role", "user")
                        .set(PARTS_KEY,
                                objectMapper.createArrayNode()
                                        .add(objectMapper.createObjectNode()
                                                .put("text", dynamicPrompt)))
        );
    }

    private void addHistoryMessagesForGemini(ArrayNode contents, List<MessageDto> history) {
        for (MessageDto message : history) {
            if (message.content() == null || message.role() == null) {
                log.warn("Invalid message data: {}", message);
                continue;
            }
            contents.add(
                    objectMapper.createObjectNode()
                            .put("role", message.role())
                            .set(PARTS_KEY,
                                    objectMapper.createArrayNode()
                                            .add(objectMapper.createObjectNode()
                                                    .put("text", message.content())))
            );
        }
    }

    private void addHistoryMessages(ArrayNode messages, List<MessageDto> history) {
        for (MessageDto message : history) {
            if (message.content() == null || message.role() == null) {
                log.warn("Invalid message data: {}", message);
                continue;
            }
            messages.add(
                    objectMapper.createObjectNode()
                            .put("role", message.role())
                            .put(CONTENT_KEY, message.content())
            );
        }
    }

    @Data
    public static class ReviewResult {
        private String generalFeedback;
        private List<InlineComment> inlineComments;
    }

    /**
     * Reviews a list of files using the specified AI provider and model,
     * tailoring feedback to the given list of aspects.
     */
    public ReviewResult reviewFiles(List<FileData> files, String aiName, String model, List<String> aspects) {
        ReviewResult result = new ReviewResult();
        result.setInlineComments(new ArrayList<>());

        if (files == null || files.isEmpty()) {
            log.warn("No files provided for review");
            result.setGeneralFeedback("Error: No files provided for review");
            return result;
        }
        if (aspects == null || aspects.isEmpty()) {
            log.warn("No aspects provided for review");
            result.setGeneralFeedback("Error: No aspects provided for review");
            return result;
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
                                .put(CONTENT_KEY, dynamicPrompt)
                );

                for (FileData file : files) {
                    if (file.getContent() == null || file.getPath() == null) {
                        log.warn("Invalid file data: {}", file);
                        continue;
                    }
                    messages.add(
                            objectMapper.createObjectNode()
                                    .put("role", "user")
                                    .put(CONTENT_KEY, "File: " + file.getPath() + "\n```java\n" + file.getContent() + "\n```")
                    );
                }
                body.set("messages", messages);
                body.put("max_tokens", 4096);
            }

            HttpEntity<String> request = new HttpEntity<>(body.toString(), headers);
            String response = restTemplate.exchange(apiUrl, HttpMethod.POST, request, String.class).getBody();
            return parseResponse(response, aiName);
        } catch (Exception e) {
            log.error("Error during {} review: {}", aiName, e.getMessage(), e);
            result.setGeneralFeedback("Error during " + aiName + " review: " + e.getMessage());
            return result;
        }
    }

    /**
     * Builds a dynamic system prompt for code review based on requested aspects,
     * enforcing that the AI respond ONLY with the specified sections and no extra headings.
     */
    private String buildSystemPrompt(List<String> aspects) {
        StringBuilder sb = new StringBuilder(
                """
                        You are an expert senior code reviewer specializing in Java and modern front-end development.
                        Provide feedback in two parts: general feedback and inline comments.
                        
                        ### General Feedback
                        Respond with the specified aspect sections below, in the order listed, using Markdown headings and concise bullet points.
                        Do NOT include any additional titles or extraneous text.
                        Focus exclusively on actionable feedback for each aspect.
                        """
        );
        for (int i = 0; i < aspects.size(); i++) {
            sb.append("#### ")
                    .append(i + 1)
                    .append(". ")
                    .append(aspects.get(i))
                    .append("\n");
        }
        sb.append("#### ")
                .append(aspects.size() + 1)
                .append(". Rate\n")
                .append("On the next line, output ONLY a single integer between 1 and 100, with no other characters, representing the overall quality of the pull request.\n\n");

        sb.append(
                """
                        ### Inline Comments
                        For each file, provide specific, concise comments tied to exact line numbers where improvements are needed.
                        Use the following JSON format for inline comments:
                        ```json
                        [
                          {
                            "path": "file/path",
                            "lineNumber": 42,
                            "comment": "Short, actionable comment (1 sentence) - (AI Name)."
                          },
                          ...
                        ]
                        ```
                        Ensure line numbers are accurate based on the provided file content.
                        If no inline comments are needed for a file, return an empty array.
                        """
        );
        return sb.toString();
    }

    private ReviewResult parseResponse(String response, String aiName) {
        ReviewResult result = new ReviewResult();
        List<InlineComment> inlineComments = new ArrayList<>();

        try {
            ObjectNode responseNode = objectMapper.readValue(response, ObjectNode.class);
            String content = isGemini(aiName)
                    ? responseNode.path("candidates").get(0).path(CONTENT_KEY).path(PARTS_KEY).get(0).path("text").asText()
                    : responseNode.path("choices").get(0).path("message").path(CONTENT_KEY).asText();

            String[] sections = content.split("### Inline Comments");
            String generalFeedback = sections[0].trim();
            result.setGeneralFeedback(generalFeedback);

            if (sections.length > 1) {
                String inlineSection = sections[1].trim();
                if (inlineSection.startsWith("```json") && inlineSection.endsWith("```")) {
                    inlineSection = inlineSection.replace("```json", "").replace("```", "").trim();
                    ArrayNode inlineArray = objectMapper.readValue(inlineSection, ArrayNode.class);
                    for (int i = 0; i < inlineArray.size(); i++) {
                        ObjectNode commentNode = (ObjectNode) inlineArray.get(i);
                        String path = commentNode.get("path").asText();
                        int lineNumber = commentNode.get("lineNumber").asInt();
                        String comment = commentNode.get("comment").asText();
                        inlineComments.add(new InlineComment(path, lineNumber, comment));
                    }
                }
            }
            result.setInlineComments(inlineComments);
        } catch (Exception e) {
            log.error("Error parsing AI response: {}", e.getMessage(), e);
            result.setGeneralFeedback("Error parsing AI response: " + e.getMessage());
        }
        return result;
    }

    /**
     * Builds Gemini-style contents with dynamic prompt for code review.
     */
    private ArrayNode buildGeminiContents(List<FileData> files, List<String> aspects) {
        ArrayNode contents = objectMapper.createArrayNode();
        contents.add(
                objectMapper.createObjectNode()
                        .put("role", "user")
                        .set(PARTS_KEY,
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
                            .set(PARTS_KEY,
                                    objectMapper.createArrayNode()
                                            .add(objectMapper.createObjectNode()
                                                    .put("text", "File: " + file.getPath() + "\n```java\n" + file.getContent() + "\n```")))
            );
        }
        return contents;
    }

    private AiProperties.Provider selectProvider(String aiName) {
        if (aiName == null) {
            throw new CodeReviewServiceException("AI name must not be null");
        }
        return switch (aiName.toLowerCase()) {
            case "chatgpt" -> properties.getChatgpt();
            case "grok"    -> properties.getGrok();
            case "copilot" -> properties.getCopilot();
            case "gemini"  -> properties.getGemini();
            default -> throw new CodeReviewServiceException("Unknown AI: " + aiName);
        };
    }

    private boolean isGemini(String aiName) {
        return "gemini".equalsIgnoreCase(aiName);
    }

    /**
     * Extracts content from the AI response based on the provider.
     */
    private String extractContent(String response, String aiName) {
        if (response == null) {
            throw new CodeReviewServiceException("Empty response from " + aiName);
        }
        try {
            JsonNode respNode = objectMapper.readTree(response);
            if (isGemini(aiName)) {
                JsonNode candidates = respNode.path("candidates");
                if (!candidates.isArray() || candidates.isEmpty()) {
                    throw new CodeReviewServiceException("Invalid response from Gemini: " + response);
                }
                JsonNode content = candidates.get(0).path(CONTENT_KEY).path(PARTS_KEY).get(0).path("text");
                return content.isMissingNode() ? "No content returned" : content.asText();
            } else {
                JsonNode choices = respNode.path("choices");
                if (!choices.isArray() || choices.isEmpty()) {
                    throw new CodeReviewServiceException("Invalid response from " + aiName + ": " + response);
                }
                JsonNode content = choices.get(0).path("message").path(CONTENT_KEY);
                return content.isMissingNode() ? "No content returned" : content.asText();
            }
        } catch (Exception e) {
            throw new CodeReviewServiceException("Failed to parse response from " + aiName, e);
        }
    }
}