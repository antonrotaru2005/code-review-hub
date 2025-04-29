package com.review.reviewservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(authorizeRequests ->  authorizeRequests
                        .requestMatchers("/api/feedbacks/**").authenticated()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().permitAll()
                )

                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/oauth2/authorization/bitbucket") // pagina de login
                        .defaultSuccessUrl("/", true) // unde ajunge user-ul după login
                )

                .logout(logout -> logout
                        .logoutSuccessUrl("/") // unde ajunge user-ul la logout
                );

        return http.build();
    }
}
