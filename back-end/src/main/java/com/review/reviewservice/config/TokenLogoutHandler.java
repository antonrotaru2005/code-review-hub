package com.review.reviewservice.config;

import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.repository.UserRepository;
import com.review.reviewservice.model.repository.WebhookTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.logout.LogoutHandler;

@Configuration
@RequiredArgsConstructor
public class TokenLogoutHandler implements LogoutHandler {

    private final WebhookTokenRepository webhookTokenRepository;
    private final UserRepository userRepository;

    @Override
    public void logout(HttpServletRequest req, HttpServletResponse res,
                       Authentication auth) {

        if (auth != null && auth.getPrincipal() instanceof OAuth2User oauth) {
            String username = oauth.getAttribute("username");
            User user = userRepository.findByUsername(username)
                            .orElseThrow(() -> new UsernameNotFoundException(username));
            webhookTokenRepository.findByUserAndActiveTrue(user)
                    .ifPresent(t -> { t.setActive(false); webhookTokenRepository.save(t); });
        }
    }
}

