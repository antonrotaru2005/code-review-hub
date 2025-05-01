package com.review.reviewservice.controller;

import com.review.reviewservice.dto.FeedbackDto;
import com.review.reviewservice.service.FeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedbacks")
@Tag(name = "Feedback", description = "Create and retrieve AI-generated feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @Autowired
    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @Operation(summary = "Create feedback", description = "Save a new feedback entry for a PR")
    @PostMapping
    public ResponseEntity<FeedbackDto> create(@RequestBody FeedbackDto request) {
        FeedbackDto saved = feedbackService.saveByUuid(
                request.prId(),
                request.username(),
                request.comment()
        );
        return ResponseEntity.ok(saved);
    }

    @Operation(summary = "Get feedbacks by PR", description = "Retrieve all feedback entries associated with a given Pull Request ID")
    @GetMapping("/pr/{prId}")
    public ResponseEntity<List<FeedbackDto>> byPr(@PathVariable Long prId) {
        return ResponseEntity.ok(feedbackService.getByPr(prId));
    }

    @Operation(summary = "Get feedbacks by user", description = "Retrieve all feedback entries submitted by a specific user")
    @GetMapping("/user/{username}")
    public List<FeedbackDto> byUser(@PathVariable String username) {
        return feedbackService.getByUser(username);
    }
}
