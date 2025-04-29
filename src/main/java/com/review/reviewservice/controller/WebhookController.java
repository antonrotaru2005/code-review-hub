package com.review.reviewservice.controller;

import com.review.reviewservice.dto.BitbucketWebhookPayload;
import com.review.reviewservice.dto.FileData;
import com.review.reviewservice.service.BitbucketService;
import com.review.reviewservice.service.ChatGPTService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/webhook")
@Tag(name = "Webhook", description = "Receive pull-request webhooks from Bitbucket")
public class WebhookController {

    private final BitbucketService bitbucketService;
    private final ChatGPTService chatGPTService;

    @Autowired
    public WebhookController(BitbucketService bitbucketService, ChatGPTService chatGPTService) {
        this.bitbucketService = bitbucketService;
        this.chatGPTService = chatGPTService;
    }

    @Operation(summary = "Handle PR webhook", description = "Endpoint called by Bitbucket on pull-request events to trigger AI analysis")
    @PostMapping("/bitbucket")
    public ResponseEntity<String> receiveWebhook(@RequestBody BitbucketWebhookPayload payload) {
        List<FileData> fetchedFiles = bitbucketService.getModifiedFiles(payload);
        String feedback = chatGPTService.reviewFiles(fetchedFiles);
        if (feedback != null) {
            bitbucketService.postCommentToPullRequest(payload, feedback);
        }

        return ResponseEntity.ok("Webhook received!");
    }
}
