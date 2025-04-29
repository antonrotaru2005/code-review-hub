package com.review.reviewservice.service;

import com.fasterxml.jackson.databind.JsonNode;
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
        // 1. Load basic user info from Bitbucket
        OAuth2User oauthUser = new DefaultOAuth2UserService().loadUser(userRequest);

        // 2. Extract the username attribute
        String username = oauthUser.getAttribute("username");
        if (username == null) {
            throw new OAuth2AuthenticationException("Username attribute not found in OAuth2 user info");
        }

        // 3. Extract email via the Bitbucket emails endpoint
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
                // find the primary confirmed email, or fallback to the first
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
        } catch (Exception ex) {
            // log warning and continue without email
            log.warn("Failed to fetch email from Bitbucket: {}", ex.getMessage());
        }

        // 4. Ensure default role exists
        Role defaultRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new IllegalStateException("ROLE_USER not found"));

        // 5. Create or update local User entity
        String finalEmail = email;
        User appUser = userRepository.findByUsername(username)
                .map(u -> {
                    u.setEmail(finalEmail);
                    return userRepository.save(u);
                })
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername(username);
                    u.setEmail(finalEmail);
                    u.setEnabled(true);
                    u.getRoles().add(defaultRole);
                    return userRepository.save(u);
                });

        // 6. Build authorities for Spring Security
        Set<GrantedAuthority> authorities = appUser.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority(r.getName()))
                .collect(Collectors.toSet());

        // 7. Return a DefaultOAuth2User with attributes from Bitbucket
        return new DefaultOAuth2User(authorities, oauthUser.getAttributes(), "username");
    }
}