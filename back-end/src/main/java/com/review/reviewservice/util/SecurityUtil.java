package com.review.reviewservice.util;

import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.repository.UserRepository;
import com.review.reviewservice.service.CustomOAuth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class SecurityUtil {

    private final UserRepository userRepository;
    private final CustomOAuth2UserService customOAuth2UserService;

    /**
     * Reautentifică utilizatorul curent, reconstruind OAuth2User cu rolurile actualizate.
     *
     * @param username           Numele de utilizator (Bitbucket username)
     * @param originalAttributes Atributele originale primite de la providerul OAuth2
     */
    public void reAuthenticate(String username, Map<String, Object> originalAttributes) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        OAuth2User updatedOauthUser = customOAuth2UserService.buildOAuth2User(user, originalAttributes);

        OAuth2AuthenticationToken authenticationToken = new OAuth2AuthenticationToken(
                updatedOauthUser,
                updatedOauthUser.getAuthorities(),
                "bitbucket-login"
        );

        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
    }
}
