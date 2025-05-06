package com.review.reviewservice.service;

import org.springframework.stereotype.Service;
import com.review.reviewservice.service.CodeReviewService;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class ChatService {

    private final CodeReviewService codeReviewService;

    @Autowired
    public ChatService(CodeReviewService codeReviewService) {
        this.codeReviewService = codeReviewService;
    }


    public String chat(String ai, String model, String message) {
        return codeReviewService.chat(ai, model, message);
    }
}
