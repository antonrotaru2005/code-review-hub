package com.review.reviewservice.controller;

import com.review.reviewservice.dto.UserDto;
import com.review.reviewservice.model.entity.AiModel;
import com.review.reviewservice.model.entity.Role;
import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.repository.UserRepository;
import com.review.reviewservice.model.repository.AiModelRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller pentru expunerea informațiilor despre utilizatorul curent.
 */
@Slf4j
@RestController
@RequestMapping("/api")
public class UserController {

    private final UserRepository userRepository;
    private final AiModelRepository aiModelRepository;

    @Autowired
    public UserController(UserRepository userRepository, AiModelRepository aiModelRepository) {
        this.userRepository = userRepository;
        this.aiModelRepository = aiModelRepository;
    }

    /**
     * Returnează informațiile despre utilizatorul autenticat.
     * @param oauthUser principalul OAuth2 conținând atributele Bitbucket
     * @return UserDto cu username, display name și email
     */
    @GetMapping("/user")
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
        String ai_model = appUser.getAiModel().getAi() + ": " + appUser.getAiModel().getModel();

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
    @PostMapping("/user/ai")
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
}