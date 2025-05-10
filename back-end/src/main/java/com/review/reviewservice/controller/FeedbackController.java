package com.review.reviewservice.controller;

import com.review.reviewservice.dto.FeedbackDto;
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
    public ResponseEntity<FeedbackDto> create(@RequestBody FeedbackDto request) {
        FeedbackDto saved = feedbackService.save(
                request.prId(),
                request.repoFullName(),
                request.username(),
                request.comment()
        );
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/pr/{prId}")
    public ResponseEntity<List<FeedbackDto>> byPr(@PathVariable Long prId) {
        return ResponseEntity.ok(feedbackService.getByPr(prId));
    }

    @GetMapping("/user/{username}")
    public List<FeedbackDto> byUser(@PathVariable String username) {
        return feedbackService.getByUser(username);
    }
}
