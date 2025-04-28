package com.review.reviewservice.controller;

import com.review.reviewservice.model.entity.Feedback;
import com.review.reviewservice.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedbacks")
public class FeedbackController {
    private final FeedbackService feedbackService;

    @Autowired
    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public ResponseEntity<Feedback> create(@RequestBody Feedback feedback) {
        Feedback savedFeedback = feedbackService.save(feedback);
        return ResponseEntity.ok(savedFeedback);
    }

    @GetMapping("/pr/{prId}")
    public ResponseEntity<List<Feedback>> byPr(@PathVariable Long prId) {
        return ResponseEntity.ok(feedbackService.getByPr(prId));
    }

    @GetMapping("/user/{userKey}")
    public ResponseEntity<List<Feedback>> byUser(@PathVariable String userKey) {
        return ResponseEntity.ok(feedbackService.getByUser(userKey));
    }
}
