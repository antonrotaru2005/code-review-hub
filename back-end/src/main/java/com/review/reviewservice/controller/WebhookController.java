package com.review.reviewservice.controller;

import com.review.reviewservice.dto.BitbucketWebhookPayload;
import com.review.reviewservice.dto.FileData;
import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.repository.UserRepository;
import com.review.reviewservice.service.BitbucketService;
import com.review.reviewservice.service.ChatGPTService;
import com.review.reviewservice.service.FeedbackService;
import com.review.reviewservice.service.GrokService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/webhook")
@Tag(name = "Webhook", description = "Receive pull-request webhooks from Bitbucket and manage AI preferences")
public class WebhookController {

    private final BitbucketService bitbucketService;
    private final ChatGPTService chatGPTService;
    private final GrokService grokService;
    private final FeedbackService feedbackService;
    private final UserRepository userRepository;

    @Autowired
    public WebhookController(BitbucketService bitbucketService,
                             ChatGPTService chatGPTService,
                             GrokService grokService,
                             FeedbackService feedbackService,
                             UserRepository userRepository) {
        this.bitbucketService = bitbucketService;
        this.chatGPTService = chatGPTService;
        this.grokService = grokService;
        this.feedbackService = feedbackService;
        this.userRepository = userRepository;
    }

    @Operation(summary = "Handle PR webhook", description = "Process Bitbucket pull-request event: generate and persist AI feedback based on the user's preferred AI, then comment on PR")
    @PostMapping("/bitbucket")
    public ResponseEntity<String> receiveWebhook(@RequestBody BitbucketWebhookPayload payload) {
        // 1. Fetch modified files from Bitbucket
        List<FileData> fetchedFiles = bitbucketService.getModifiedFiles(payload);

        // 2. Determine the preferred AI for the user
        String uuid = payload.getPullRequest().getAuthor().getUuid();
        User user = userRepository.findByBitbucketUuid(uuid)
                .orElseThrow(() -> new IllegalStateException("User not found: " + uuid));

        String ai = user.getAiModel() != null ? user.getAiModel().getAi() : "chatgpt";
        String model = user.getAiModel() != null ? user.getAiModel().getModel() : "gpt-4o-mini"; // Default model

        // 3. Generate feedback using the selected AI
        String feedback;
        if ("grok".equalsIgnoreCase(ai)) {
            feedback = grokService.reviewFiles(fetchedFiles, model);
        } else {
            feedback = chatGPTService.reviewFiles(fetchedFiles, model);
        }

        if (feedback != null) {
            Long prId = payload.getPullRequest().getId();
            String repoFullName = payload.getRepository().getFullName();

            // Post comment on PR
            bitbucketService.postCommentToPullRequest(payload, feedback);

            // Save feedback to database
            feedbackService.save(prId, uuid, feedback, repoFullName);
        }
        return ResponseEntity.ok("Webhook processed and feedback saved using " + ai + " with model " + model + ".");
    }
}