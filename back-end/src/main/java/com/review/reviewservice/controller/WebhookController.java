package com.review.reviewservice.controller;

import com.review.reviewservice.dto.BitbucketWebhookPayload;
import com.review.reviewservice.dto.FileData;
import com.review.reviewservice.model.entity.AiModel;
import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.repository.UserRepository;
import com.review.reviewservice.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/webhook")
@Tag(name = "Webhook", description = "Receive pull-request webhooks from Bitbucket and manage AI preferences")
public class WebhookController {

    private final BitbucketService bitbucketService;
    private final CodeReviewService codeReviewService;
    private final FeedbackService feedbackService;
    private final UserRepository userRepository;

    @Autowired
    public WebhookController(BitbucketService bitbucketService, CodeReviewService codeReviewService,
                             FeedbackService feedbackService,
                             UserRepository userRepository) {
        this.bitbucketService = bitbucketService;
        this.codeReviewService = codeReviewService;
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + uuid));

        String ai = Optional.ofNullable(user.getAiModel())
                .map(m -> m.getAi().toLowerCase())
                .orElse("ChatGPT");
        String model = Optional.ofNullable(user.getAiModel())
                .map(AiModel::getModel)
                .orElse("gpt-4o");

        // 3. Generate feedback using the selected AI
        String feedback = codeReviewService.reviewFiles(fetchedFiles, ai, model);

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