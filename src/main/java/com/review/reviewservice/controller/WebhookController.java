package com.review.reviewservice.controller;

import com.review.reviewservice.dto.BitbucketWebhookPayload;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/webhook")
public class WebhookController {

    public WebhookController() {
    }

    @PostMapping("/bitbucket")
    public ResponseEntity<String> recieveWebhook(@RequestBody BitbucketWebhookPayload payload) {
        System.out.println("Webhook: \n");
        System.out.println(payload.toString());

        return ResponseEntity.ok("Files fetched!");
    }
}
