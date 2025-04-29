package com.review.reviewservice.controller;

import com.review.reviewservice.model.entity.Feedback;
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
    public ResponseEntity<Feedback> create(@RequestBody Feedback feedback) {
        Feedback savedFeedback = feedbackService.save(feedback);
        return ResponseEntity.ok(savedFeedback);
    }

    @Operation(summary = "Get feedbacks by PR", description = "Retrieve all feedback entries associated with a given Pull Request ID")
    @GetMapping("/pr/{prId}")
    public ResponseEntity<List<Feedback>> byPr(@PathVariable Long prId) {
        return ResponseEntity.ok(feedbackService.getByPr(prId));
    }

    @Operation(summary = "Get feedbacks by user", description = "Retrieve all feedback entries submitted by a specific user")
    @GetMapping("/user/{userKey}")
    public ResponseEntity<List<Feedback>> byUser(@PathVariable String userKey) {
        return ResponseEntity.ok(feedbackService.getByUser(userKey));
    }
}
