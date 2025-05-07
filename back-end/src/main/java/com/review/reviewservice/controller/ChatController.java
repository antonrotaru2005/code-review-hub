package com.review.reviewservice.controller;

import com.review.reviewservice.dto.ChatRequestDto;
import com.review.reviewservice.dto.ChatResponseDto;
import com.review.reviewservice.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;


@Slf4j
@RestController
@RequestMapping("/api/chat")
@Tag(name = "Chat", description = "Interact with AI chat models")
public class ChatController {

    private final ChatService chatService;

    @Autowired
    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @Operation(summary = "Send message to AI model and get reply")
    @PostMapping
    public ResponseEntity<ChatResponseDto> chat(
            @RequestBody ChatRequestDto request,
            @AuthenticationPrincipal OAuth2User oauthUser
    ) {
        String reply = chatService.chat(
                request.ai(),
                request.model(),
                request.history()
        );
        return ResponseEntity.ok(new ChatResponseDto(reply));
    }
}
