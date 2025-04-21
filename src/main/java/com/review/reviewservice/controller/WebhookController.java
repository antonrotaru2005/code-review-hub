package com.review.reviewservice.controller;

import com.review.reviewservice.dto.BitbucketWebhookPayload;
import com.review.reviewservice.dto.FileData;
import com.review.reviewservice.service.BitbucketService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        List<FileData> fetchedFiles = bitbucketService.getModifiedFiles(payload);
        System.out.println("Modified files: ");
        for (FileData fileData : fetchedFiles) {
            System.out.println("\nPath: " + fileData.getPath());
            System.out.println("Content: " + fileData.getContent());
        }
        return ResponseEntity.ok("Webhook received!");
    }
}
