package com.review.reviewservice.config;

import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.repository.UserRepository;
import com.review.reviewservice.model.repository.WebhookTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.logout.LogoutHandler;

import java.util.logging.Logger;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class TokenLogoutHandler implements LogoutHandler {

    private final WebhookTokenRepository webhookTokenRepository;
    private final UserRepository userRepository;

    @Override
    public void logout(HttpServletRequest req, HttpServletResponse res, Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof OAuth2User oauth)) {
            log.warn("No valid OAuth2 authentication found during logout");
            return;
        }

        String username = oauth.getAttribute("username"); // Verify this attribute
        if (username == null) {
            log.error("Username attribute missing in OAuth2User attributes: {}", oauth.getAttributes());
            return;
        }

        try {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
            webhookTokenRepository.findByUserAndActiveTrue(user)
                    .ifPresent(token -> {
                        token.setActive(false);
                        webhookTokenRepository.save(token);
                        log.info("Deactivated webhook token for user: {}", username);
                    });
        } catch (UsernameNotFoundException e) {
            log.error("User not found during logout: {}", username, e);
        } catch (Exception e) {
            log.error("Error deactivating webhook token for user: {}", username, e);
        }
    }
}

