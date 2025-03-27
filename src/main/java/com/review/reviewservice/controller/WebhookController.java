package com.review.reviewservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/webhook")
public class WebhookController {

    @PostMapping("/bitbucket")
    public ResponseEntity<String> recieveWebhook(@RequestBody Map<String, Object> payload) {
        System.out.println("Webhook: ");
        System.out.println(payload);

        String eventKey = (String) payload.get("eventKey");

        Map<String, Object> pullRequest = (Map<String, Object>) payload.get("pullRequest");
        String title = (String) pullRequest.get("title");
        Map<String, Object> author = (Map<String, Object>) pullRequest.get("author");
        String username = (String) ((Map<String, Object>) author.get("user")).get("displayName");

        System.out.println("PR title: " + title);
        System.out.println("Created by: " + username);
        System.out.println("Event type: " + eventKey);

        return ResponseEntity.ok("Webhook parsed!");
    }
}
