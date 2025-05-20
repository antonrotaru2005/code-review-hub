package com.review.reviewservice.controller;

import com.review.reviewservice.dto.BitbucketWebhookPayload;
import com.review.reviewservice.dto.FileData;
import com.review.reviewservice.model.entity.AiModel;
import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.entity.WebhookToken;
import com.review.reviewservice.model.repository.UserRepository;
import com.review.reviewservice.model.repository.WebhookTokenRepository;
import com.review.reviewservice.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/webhook")
public class WebhookController {

    private final BitbucketService bitbucketService;
    private final CodeReviewService codeReviewService;
    private final FeedbackService feedbackService;
    private final UserRepository userRepository;
    private final WebhookTokenRepository webhookTokenRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public WebhookController(BitbucketService bitbucketService, CodeReviewService codeReviewService,
                             FeedbackService feedbackService,
                             UserRepository userRepository, WebhookTokenRepository webhookTokenRepository, SimpMessagingTemplate messagingTemplate) {
        this.bitbucketService = bitbucketService;
        this.codeReviewService = codeReviewService;
        this.feedbackService = feedbackService;
        this.userRepository = userRepository;
        this.webhookTokenRepository = webhookTokenRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/bitbucket/{token}")
    public ResponseEntity<String> receiveWebhook(
            @PathVariable String token,
            @RequestBody BitbucketWebhookPayload payload) {
        WebhookToken wt = webhookTokenRepository.findByTokenAndActiveTrue(token)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Token inactive or not found"));

        if (wt.getExpiresAt() != null && wt.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new ResponseStatusException(HttpStatus.GONE, "Token expired");

        // Find the user
        String uuid = payload.getPullRequest().getAuthor().getUuid();
        User user = userRepository.findByBitbucketUuid(uuid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + uuid));
        String username = user.getUsername();

        // 1. Fetch modified files from Bitbucket
        messagingTemplate.convertAndSend(
                "/topic/feedback/" + username,
                Map.of("stage", "Processing PR")
        );

        List<FileData> fetchedFiles = bitbucketService.getModifiedFiles(payload);

        // 2. Determine the preferred AI for the user
        messagingTemplate.convertAndSend(
                "/topic/feedback/" + username,
                Map.of("stage", "Files fetched")
        );

        String ai = Optional.ofNullable(user.getAiModel())
                .map(m -> m.getAi().toLowerCase())
                .orElse("ChatGPT");
        String model = Optional.ofNullable(user.getAiModel())
                .map(AiModel::getModel)
                .orElse("gpt-4o");

        // 3. Generate feedback using the selected AI
        messagingTemplate.convertAndSend(
                "/topic/feedback/" + username,
                Map.of("stage", "AI Code Analysis")
        );

        List<String> aspects = user.getReviewAspectsList();

        String feedback = codeReviewService.reviewFiles(fetchedFiles, ai, model, aspects);

        if (feedback != null) {
            Long prId = payload.getPullRequest().getId();
            String repoFullName = payload.getRepository().getFullName();
            int rate = extractRate(feedback);

            // Post comment on PR
            messagingTemplate.convertAndSend(
                    "/topic/feedback/" + username,
                    Map.of("stage", "Saving feedback")
            );

            bitbucketService.postCommentToPullRequest(payload, feedback);

            // Save feedback to database
            feedbackService.save(prId, uuid, feedback, model, repoFullName, rate);

            messagingTemplate.convertAndSend(
                    "/topic/feedback/" + username,
                    Map.of("stage", "Done", "status", "done", "prId", prId)
            );
        }
        return ResponseEntity.ok("Webhook processed and feedback saved using " + ai + " with model " + model + ".");
    }

    private int extractRate(String feedback) {
        String[] lines = feedback.split("\\r?\\n");
        Pattern numPattern = Pattern.compile("\\b(\\d{1,3})\\b");

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].toLowerCase();
            if (line.contains("rate")) {
                if (i + 1 < lines.length) {
                    String next = lines[i + 1].trim();
                    try {
                        int rate = Integer.parseInt(next.replaceAll("\\D", ""));
                        return clampRate(rate);
                    } catch (NumberFormatException ignored) {}
                }
                Matcher m = numPattern.matcher(lines[i]);
                if (m.find()) {
                    return clampRate(Integer.parseInt(m.group(1)));
                }
            }
        }

        Matcher m = numPattern.matcher(feedback);
        int last = 0;
        while (m.find()) {
            last = Integer.parseInt(m.group(1));
        }
        return clampRate(last);
    }

    private int clampRate(int rate) {
        if (rate <= 0) return 0;
        return Math.min(100, rate);
    }

}