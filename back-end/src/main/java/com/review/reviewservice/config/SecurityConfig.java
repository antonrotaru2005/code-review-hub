package com.review.reviewservice.config;

import com.review.reviewservice.exceptions.UserAlreadyExistsException;
import com.review.reviewservice.exceptions.UserNotFoundException;
import com.review.reviewservice.service.CustomOAuth2UserService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final String frontendUrl;

    @Autowired
    public SecurityConfig(
            CustomOAuth2UserService customOAuth2UserService,
            @Value("${frontend.url}") String frontendUrl) {
        this.customOAuth2UserService = customOAuth2UserService;
        this.frontendUrl = frontendUrl;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, TokenLogoutHandler tokenLogoutHandler) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/feedbacks/**").authenticated()
                        .requestMatchers("/api/chat").authenticated()
                        .requestMatchers("/api/user/**").authenticated()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().permitAll()
                )
                .exceptionHandling(ex -> ex
                        .accessDeniedHandler((req, res, ex2) ->
                                res.sendError(HttpServletResponse.SC_FORBIDDEN, "Access Denied"))
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(authenticationSuccessHandler())
                        .failureHandler(authenticationFailureHandler())
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                        )
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .addLogoutHandler(tokenLogoutHandler)
                        .logoutSuccessUrl(frontendUrl)
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                );

        return http.build();
    }


    /**
     * Handles authentication failures by redirecting to front-end with error codes.
     */
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

    /**
     * Handles successful authentication by redirecting to user profile page.
     */
    @Bean
    public AuthenticationSuccessHandler authenticationSuccessHandler() {
        return new SimpleUrlAuthenticationSuccessHandler(frontendUrl + "/user");
    }
}
