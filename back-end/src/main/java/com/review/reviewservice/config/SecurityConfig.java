package com.review.reviewservice.config;

import com.review.reviewservice.exceptions.UserAlreadyExistsException;
import com.review.reviewservice.exceptions.UserNotFoundException;
import com.review.reviewservice.service.CustomOAuth2UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthorizationRequestResolver authorizationRequestResolver;
    private final String frontendUrl;

    @Autowired
    public SecurityConfig(CustomOAuth2UserService customOAuth2UserService,
                          OAuth2AuthorizationRequestResolver authorizationRequestResolver,
                          @Value("${frontend.url}") String frontendUrl) {
        this.customOAuth2UserService = customOAuth2UserService;
        this.authorizationRequestResolver = authorizationRequestResolver;
        this.frontendUrl = frontendUrl;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/feedbacks/**").authenticated()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().permitAll()
                )
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(endpoint -> endpoint
                                .authorizationRequestResolver(authorizationRequestResolver)
                        )
                        .loginPage("/oauth2/authorization/bitbucket")
                        .successHandler(authenticationSuccessHandler())
                        .failureHandler(authenticationFailureHandler())
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                        )
                )
                .logout(logout -> logout
                        .logoutSuccessUrl(frontendUrl)
                );
        return http.build();
    }

    @Bean
    public AuthenticationFailureHandler authenticationFailureHandler() {
        return (request, response, exception) -> {
            log.error("OAuth2 authentication failed: {}", exception.getMessage());
            if (exception instanceof UserAlreadyExistsException) {
                response.sendRedirect(frontendUrl + "/signup?error=user_exists");
            } else if (exception instanceof UserNotFoundException) {
                response.sendRedirect(frontendUrl + "/login?error=user_not_found");
            } else {
                response.sendRedirect(frontendUrl + "/login?error=auth_failed");
            }
        };
    }

    @Bean
    public AuthenticationSuccessHandler authenticationSuccessHandler() {
        log.info("Authentication successful, redirecting to {}/user", frontendUrl);
        return new SimpleUrlAuthenticationSuccessHandler(frontendUrl + "/user");
    }
}
