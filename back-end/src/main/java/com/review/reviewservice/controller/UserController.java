package com.review.reviewservice.controller;

import com.review.reviewservice.dto.UserDto;
import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.repository.UserRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controller pentru expunerea informațiilor despre utilizatorul curent.
 */
@RestController
@RequestMapping("/api")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Returnează informațiile despre utilizatorul autenticat.
     * @param oauthUser principalul OAuth2 conținând atributele Bitbucket
     * @return UserDto cu username, display name și email
     */
    @GetMapping("/user")
    public UserDto getUserInfo(@AuthenticationPrincipal OAuth2User oauthUser) {
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

        return new UserDto(username, displayName, email, avatarUrl);
    }
}
