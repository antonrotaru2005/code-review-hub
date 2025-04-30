package com.review.reviewservice.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuration to customize the OAuth2 authorization request resolver
 * so that we propagate the 'action' query parameter (login or signup).
 */
@Configuration
public class OAuth2ClientConfig {
    @Bean
    public OAuth2AuthorizationRequestResolver customAuthorizationRequestResolver(
            ClientRegistrationRepository clientRegistrationRepository) {
        DefaultOAuth2AuthorizationRequestResolver defaultResolver =
                new DefaultOAuth2AuthorizationRequestResolver(
                        clientRegistrationRepository, "/oauth2/authorization");

        defaultResolver.setAuthorizationRequestCustomizer(builder -> {
            // Read 'action' parameter from the original HTTP request
            HttpServletRequest servletRequest = ((ServletRequestAttributes)
                    RequestContextHolder.currentRequestAttributes()).getRequest();
            String action = servletRequest.getParameter("action");
            if (action != null) {
                Map<String, Object> additionalParams = new HashMap<>();
                additionalParams.put("action", action);
                // Propagate it into the OAuth2 AuthorizationRequest
                builder.additionalParameters(additionalParams);
            }
        });

        return defaultResolver;
    }
}