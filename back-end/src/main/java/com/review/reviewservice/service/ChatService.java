package com.review.reviewservice.service;

import com.review.reviewservice.dto.MessageDto;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Service
public class ChatService {

    private final CodeReviewService codeReviewService;

    @Autowired
    public ChatService(CodeReviewService codeReviewService) {
        this.codeReviewService = codeReviewService;
    }

    public String chat(String ai, String model, List<MessageDto> history) {
        return codeReviewService.chat(ai, model, history);
    }
}
