package com.review.reviewservice.controller;

import com.review.reviewservice.dto.UserDto;
import com.review.reviewservice.model.entity.AiModel;
import com.review.reviewservice.model.entity.Role;
import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.entity.WebhookToken;
import com.review.reviewservice.model.repository.UserRepository;
import com.review.reviewservice.model.repository.AiModelRepository;
import com.review.reviewservice.model.repository.WebhookTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller pentru expunerea informațiilor despre utilizatorul curent.
 */
@Slf4j
@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserRepository userRepository;
    private final AiModelRepository aiModelRepository;
    private final WebhookTokenRepository webhookTokenRepository;

    @Autowired
    public UserController(UserRepository userRepository, AiModelRepository aiModelRepository, WebhookTokenRepository webhookTokenRepository) {
        this.userRepository = userRepository;
        this.aiModelRepository = aiModelRepository;
        this.webhookTokenRepository = webhookTokenRepository;
    }

    /**
     * Returnează informațiile despre utilizatorul autenticat.
     * @param oauthUser principalul OAuth2 conținând atributele Bitbucket
     * @return UserDto cu username, display name și email
     */
    @GetMapping
    public UserDto getUserInfo(@AuthenticationPrincipal OAuth2User oauthUser) {
        if (oauthUser == null) {
            log.error("OAuth2User is null in getUserInfo");
            throw new IllegalStateException("No authenticated OAuth2 user found");
        }
        String username = oauthUser.getAttribute("username");
        String displayName = oauthUser.getAttribute("display_name");
        if (displayName == null) {
            displayName = username;
        }
        User appUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found: " + username));
        String email = appUser.getEmail();
        String avatarUrl = null;
        Object links = oauthUser.getAttribute("links");
        if (links instanceof Map<?, ?> map) {
            Object avatar = map.get("avatar");
            if (avatar instanceof Map<?, ?> av) {
                avatarUrl = (String) av.get("href");
            }
        }
        AiModel ai_model = appUser.getAiModel();
        
        List<String> roles = appUser.getRoles().stream()
                .map(Role::getName)
                .toList();

        return new UserDto(username, displayName, email, avatarUrl, ai_model, roles);
    }

    /**
     * Setează modelul AI preferat pentru utilizatorul autenticat.
     * @param oauthUser principalul OAuth2 conținând atributele Bitbucket
     * @param ai Numele AI-ului (chatgpt sau grok)
     * @param model Numele modelului (ex. gpt-4o-mini, gpt-3.5-turbo, grok)
     * @return Mesaj de confirmare
     */
    @PostMapping("/ai")
    public ResponseEntity<String> setAiPreference(
            @AuthenticationPrincipal OAuth2User oauthUser,
            @RequestParam String ai,
            @RequestParam String model) {
        String username = oauthUser.getAttribute("username");
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found: " + username));

        AiModel aiModel = aiModelRepository.findByAiIgnoreCaseAndModelIgnoreCase(ai, model)
                .orElseThrow(() -> new IllegalArgumentException("AI model not found for ai: " + ai + " and model: " + model));

        user.setAiModel(aiModel);
        userRepository.save(user);

        return ResponseEntity.ok("AI preference set to " + ai + " with model " + model + " for user " + username + ".");
    }

    @PostMapping("/webhook-token")
    public ResponseEntity<Map<String,String>> generateToken(@AuthenticationPrincipal OAuth2User oauthUser) {
        String username = oauthUser.getAttribute("username");
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        String token = UUID.randomUUID().toString();
        WebhookToken wt = new WebhookToken();
        wt.setToken(token);
        wt.setUser(user);
        wt.setExpiresAt(LocalDateTime.now().plusHours(1));
        webhookTokenRepository.save(wt);

        return ResponseEntity.ok(Map.of("token", token));
    }
}