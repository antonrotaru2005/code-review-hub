package com.review.reviewservice.controller;

import com.review.reviewservice.dto.BitbucketWebhookPayload;
import com.review.reviewservice.dto.FileData;
import com.review.reviewservice.service.BitbucketService;
import com.review.reviewservice.service.ChatGPTService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/webhook")
public class WebhookController {

    private final BitbucketService bitbucketService;
    private final ChatGPTService chatGPTService;

    @Autowired
    public WebhookController(BitbucketService bitbucketService, ChatGPTService chatGPTService) {
        this.bitbucketService = bitbucketService;
        this.chatGPTService = chatGPTService;
    }

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
