package com.review.reviewservice.controller;

import com.review.reviewservice.dto.FeedbackDto;
import com.review.reviewservice.dto.UserDto;
import com.review.reviewservice.service.FeedbackService;
import com.review.reviewservice.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserService userService;
    private final FeedbackService feedbackService;

    @Autowired
    public AdminController(UserService userService, FeedbackService feedbackService) {
        this.userService = userService;
        this.feedbackService = feedbackService;
    }

    /**
     * List all registered users (admin only).
     * @return list of UserDto
     */
    @GetMapping("/users")
    public List<UserDto> listAllUsers() {
        return userService.getAllUsers();
    }

    /**
     * List all feedback entries (admin only).
     * @return list of FeedbackDto
     */
    @GetMapping("/feedbacks")
    public List<FeedbackDto> listAllFeedbacks() {
        return feedbackService.getAllFeedbacks();
    }

    /**
     * List feedback entries by specific user (admin only).
     * @param username the username of the user
     * @return list of FeedbackDto
     */
    @GetMapping("/users/{username}/feedbacks")
    public List<FeedbackDto> listFeedbacksByUser(@PathVariable String username) {
        return feedbackService.getByUser(username);
    }

    /**
     * Delete a feedback entry by ID (admin only).
     * @param id the feedback ID
     */
    @DeleteMapping("/feedbacks/{id}")
    public void deleteFeedback(@PathVariable Long id) {
        feedbackService.deleteById(id);
    }
}
