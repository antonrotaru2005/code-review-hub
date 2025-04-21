package com.review.reviewservice.controller;

import com.review.reviewservice.dto.BitbucketWebhookPayload;
import com.review.reviewservice.service.BitbucketService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/webhook")
public class WebhookController {

    private final BitbucketService bitbucketService;

    @Autowired
    public WebhookController(BitbucketService bitbucketService) {
        this.bitbucketService = bitbucketService;
    }

    @PostMapping("/bitbucket")
    public ResponseEntity<String> receiveWebhook(@RequestBody BitbucketWebhookPayload payload) {
        bitbucketService.getModifiedFiles(payload);
        return ResponseEntity.ok("Webhook received!");
    }
}
