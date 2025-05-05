package com.review.reviewservice.controller;

import com.review.reviewservice.dto.BitbucketWebhookPayload;
import com.review.reviewservice.dto.FileData;
import com.review.reviewservice.service.BitbucketService;
import com.review.reviewservice.service.ChatGPTService;
import com.review.reviewservice.service.FeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/webhook")
@Tag(name = "Webhook", description = "Receive pull-request webhooks from Bitbucket and persist feedback")
public class WebhookController {

    private final BitbucketService bitbucketService;
    private final ChatGPTService chatGPTService;
    private final FeedbackService feedbackService;

    @Autowired
    public WebhookController(BitbucketService bitbucketService,
                             ChatGPTService chatGPTService,
                             FeedbackService feedbackService) {
        this.bitbucketService = bitbucketService;
        this.chatGPTService = chatGPTService;
        this.feedbackService = feedbackService;
    }

    @Operation(summary = "Handle PR webhook", description = "Process Bitbucket pull-request event: generate and persist AI feedback, then comment on PR")
    @PostMapping("/bitbucket")
    public ResponseEntity<String> receiveWebhook(@RequestBody BitbucketWebhookPayload payload) {
        // 1. Fetch modified files from Bitbucket
        List<FileData> fetchedFiles = bitbucketService.getModifiedFiles(payload);

        String feedback = chatGPTService.reviewFiles(fetchedFiles);

        if (feedback != null) {
            Long prId = payload.getPullRequest().getId();
            String repoFullName = payload.getRepository().getFullName();
            String uuid = payload.getPullRequest().getAuthor().getUuid();

            // Postează pe PR
            bitbucketService.postCommentToPullRequest(payload, feedback);

            // Salvez în BD găsind mai întâi user-ul după UUID
            feedbackService.save(prId, uuid, feedback, repoFullName);
        }
        return ResponseEntity.ok("Webhook processed and feedback saved.");
    }
}
