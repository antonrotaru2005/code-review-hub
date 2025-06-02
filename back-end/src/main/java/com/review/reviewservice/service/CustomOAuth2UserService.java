package com.review.reviewservice.service;

import com.review.reviewservice.exceptions.UserAlreadyExistsException;
import com.review.reviewservice.exceptions.UserNotFoundException;
import com.review.reviewservice.model.entity.AiModel;
import com.review.reviewservice.model.entity.Role;
import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.repository.AiModelRepository;
import com.review.reviewservice.model.repository.RoleRepository;
import com.review.reviewservice.model.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service pentru autentificare OAuth2, care gestioneaza atat login cat și signup.
 * Utilizeaza EmailFetcherService pentru extragerea email-ului.
 */
@Slf4j
@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailFetcherService emailFetcherService;
    private final AiModelRepository aiModelRepository;

    @Autowired
    public CustomOAuth2UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            EmailFetcherService emailFetcherService, AiModelRepository aiModelRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.emailFetcherService = emailFetcherService;
        this.aiModelRepository = aiModelRepository;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. Încarcă datele userului de bază de la Bitbucket
        OAuth2User oauthUser = new DefaultOAuth2UserService().loadUser(userRequest);
        String username = oauthUser.getAttribute("username");
        if (username == null) {
            throw new OAuth2AuthenticationException("Username not found");
        }

        // 2. Determină fluxul: signup sau login după registrationId
        String regId = userRequest.getClientRegistration().getRegistrationId();
        boolean isSignup = "bitbucket-signup".equals(regId);
        boolean exists = userRepository.findByUsername(username).isPresent();

        if (isSignup) {
            // Signup: eroare dacă există deja
            if (exists) {
                throw new UserAlreadyExistsException("User already exists");
            }
            // Creează cont nou
            return createNewUser(oauthUser, userRequest, username);
        } else {
            // Login: eroare dacă nu există
            if (!exists) {
                throw new UserNotFoundException("User not found");
            }
            User appUser = userRepository.findByUsername(username)
                    .orElseThrow(() -> new CodeReviewServiceException("User not found for username: " + username));
            return buildOAuth2User(appUser, oauthUser.getAttributes());
        }
    }

    /**
     * Construiește DefaultOAuth2User cu rolurile stocate în baza de date.
     */
    private OAuth2User buildOAuth2User(User appUser, Map<String,Object> attributes) {
        Set<GrantedAuthority> auth = appUser.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority(r.getName()))
                .collect(Collectors.toSet());
        log.info("Building OAuth2User for username: {}, roles: {}",
                appUser.getUsername(),
                auth.stream().map(GrantedAuthority::getAuthority).toList());
        return new DefaultOAuth2User(auth, attributes, "username");
    }

    /**
     * Creează un utilizator nou, dacă signup, și îi setază email și rolul implicit.
     */
    private OAuth2User createNewUser(OAuth2User oauthUser,
                                     OAuth2UserRequest userRequest,
                                     String username) {
        // Fetch email folosind serviciul dedicat
        String token = userRequest.getAccessToken().getTokenValue();
        String email = emailFetcherService.fetchPrimaryEmail(token);
        String uuid = oauthUser.getAttribute("uuid");
        String name = oauthUser.getAttribute("display_name");
        String avatarUrl = null;
        Object links = oauthUser.getAttribute("links");
        if (links instanceof Map<?, ?> map) {
            Object avatar = map.get("avatar");
            if (avatar instanceof Map<?, ?> av) {
                avatarUrl = (String) av.get("href");
            }
        }

        // Assume the role "ROLE_USER"
        Role defaultRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new IllegalStateException("ROLE_USER not found"));

        // Fetch AiModel with id = 1
        AiModel defaultAiModel = aiModelRepository.findById(1L)
                .orElseThrow(() -> new IllegalStateException("AiModel with id 1 not found"));

        // Creare și salvare
        User appUser = new User();
        appUser.setUsername(username);
        appUser.setBitbucketUuid(uuid);
        appUser.setEmail(email);
        appUser.setEnabled(true);
        appUser.getRoles().add(defaultRole);
        appUser.setAiModel(defaultAiModel);
        appUser.setName(name);
        appUser.setAvatar(avatarUrl);
        userRepository.save(appUser);
        log.info("New user created: {}", username);

        // Returnare OAuth2User
        return buildOAuth2User(appUser, oauthUser.getAttributes());
    }
}