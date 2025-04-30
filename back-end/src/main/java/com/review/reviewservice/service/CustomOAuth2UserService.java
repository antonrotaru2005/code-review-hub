package com.review.reviewservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.review.reviewservice.exceptions.UserAlreadyExistsException;
import com.review.reviewservice.exceptions.UserNotFoundException;
import com.review.reviewservice.model.entity.Role;
import com.review.reviewservice.model.entity.User;
import com.review.reviewservice.model.repository.RoleRepository;
import com.review.reviewservice.model.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
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
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Autowired
    public CustomOAuth2UserService(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauthUser = new DefaultOAuth2UserService().loadUser(userRequest);
        String username = oauthUser.getAttribute("username");
        if (username == null) {
            throw new OAuth2AuthenticationException("Username not found");
        }

        // Pe registrationId decidem login vs signup
        String regId = userRequest.getClientRegistration().getRegistrationId();
        boolean isSignup = "bitbucket-signup".equals(regId);
        boolean userExists = userRepository.findByUsername(username).isPresent();

        if (isSignup) {
            if (userExists) {
                throw new UserAlreadyExistsException("User already exists");
            }
            return createNewUser(oauthUser, userRequest, username);
        } else {
            // login
            if (!userExists) {
                throw new UserNotFoundException("User not found");
            }
            User appUser = userRepository.findByUsername(username).get();
            return buildOAuth2User(appUser, oauthUser.getAttributes());
        }
    }

    private OAuth2User buildOAuth2User(User appUser, Map<String,Object> attributes) {
        Set<GrantedAuthority> auth = appUser.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority(r.getName()))
                .collect(Collectors.toSet());
        return new DefaultOAuth2User(auth, attributes, "username");
    }


    private OAuth2User createNewUser(OAuth2User oauthUser, OAuth2UserRequest userRequest, String username) {
        // Extract email via the Bitbucket emails endpoint
        String email = null;
        try {
            String token = userRequest.getAccessToken().getTokenValue();
            RestTemplate rt = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            // Bitbucket user emails endpoint
            ResponseEntity<JsonNode> resp = rt.exchange(
                    "https://api.bitbucket.org/2.0/user/emails",
                    HttpMethod.GET,
                    entity,
                    JsonNode.class
            );

            JsonNode values = Objects.requireNonNull(resp.getBody()).get("values");
            if (values != null && values.isArray()) {
                // Find the primary confirmed email, or fallback to the first
                for (JsonNode node : values) {
                    if (node.path("is_primary").asBoolean(false)
                            && node.path("is_confirmed").asBoolean(false)) {
                        email = node.path("email").asText(null);
                        break;
                    }
                }
                if (email == null && !values.isEmpty()) {
                    email = values.get(0).path("email").asText(null);
                }
            }
            log.info("Extracted email: {}", email);
        } catch (Exception ex) {
            log.warn("Failed to fetch email from Bitbucket: {}", ex.getMessage());
        }

        // Ensure default role exists
        Role defaultRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new IllegalStateException("ROLE_USER not found"));

        // Create new user
        User appUser = new User();
        appUser.setUsername(username);
        appUser.setEmail(email);
        appUser.setEnabled(true);
        appUser.getRoles().add(defaultRole);
        userRepository.save(appUser);
        log.info("New user created: {}", username);

        // Build authorities for Spring Security
        Set<GrantedAuthority> authorities = appUser.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority(r.getName()))
                .collect(Collectors.toSet());

        return new DefaultOAuth2User(authorities, oauthUser.getAttributes(), "username");
    }
}