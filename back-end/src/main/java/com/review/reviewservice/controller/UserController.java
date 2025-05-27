package com.review.reviewservice.controller;

import com.review.reviewservice.dto.UserDto;
import com.review.reviewservice.model.entity.*;
import com.review.reviewservice.model.repository.FeedbackRepository;
import com.review.reviewservice.model.repository.UserRepository;
import com.review.reviewservice.model.repository.AiModelRepository;
import com.review.reviewservice.model.repository.WebhookTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller pentru expunerea informațiilor despre utilizatorul curent.
 */
@Slf4j
@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserRepository userRepository;
    private final AiModelRepository aiModelRepository;
    private final WebhookTokenRepository webhookTokenRepository;
    private final FeedbackRepository feedbackRepository;

    @Autowired
    public UserController(UserRepository userRepository, AiModelRepository aiModelRepository, WebhookTokenRepository webhookTokenRepository, FeedbackRepository feedbackRepository) {
        this.userRepository = userRepository;
        this.aiModelRepository = aiModelRepository;
        this.webhookTokenRepository = webhookTokenRepository;
        this.feedbackRepository = feedbackRepository;
    }

    /**
     * Returnează informațiile despre utilizatorul autenticat.
     * @param oauthUser principalul OAuth2 conținând atributele Bitbucket
     * @return UserDto cu username, display name și email
     */
    @GetMapping
    public UserDto getUserInfo(@AuthenticationPrincipal OAuth2User oauthUser) {
        if (oauthUser == null) {
            log.error("OAuth2User este null în getUserInfo");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Niciun utilizator OAuth2 autentificat găsit");
        }
        String username = oauthUser.getAttribute("username");
        if (username == null) {
            log.error("Atributul 'username' lipsește din OAuth2User: {}", oauthUser.getAttributes());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Atributul 'username' lipsește");
        }
        String displayName = oauthUser.getAttribute("display_name");
        if (displayName == null) {
            displayName = username;
        }
        User appUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizator nu a fost găsit: " + username));
        String email = appUser.getEmail();
        String avatarUrl = null;
        Object links = oauthUser.getAttribute("links");
        if (links instanceof Map<?, ?> map) {
            Object avatar = map.get("avatar");
            if (avatar instanceof Map<?, ?> av) {
                avatarUrl = (String) av.get("href");
            }
        }
        AiModel ai_model = appUser.getAiModel();

        List<String> roles = appUser.getRoles().stream()
                .map(Role::getName)
                .toList();

        List<String> teams = appUser.getTeams().stream()
                .map(Team::getName)
                .toList();

        return new UserDto(username, displayName, email, avatarUrl, ai_model, roles, teams);
    }

    /**
     * Setează modelul AI preferat pentru utilizatorul autenticat.
     * @param oauthUser principalul OAuth2 conținând atributele Bitbucket
     * @param ai Numele AI-ului (chatgpt sau grok)
     * @param model Numele modelului (ex. gpt-4o-mini, gpt-3.5-turbo, grok)
     * @return Mesaj de confirmare
     */
    @PostMapping("/ai")
    public ResponseEntity<String> setAiPreference(
            @AuthenticationPrincipal OAuth2User oauthUser,
            @RequestParam String ai,
            @RequestParam String model) {
        String username = oauthUser.getAttribute("username");
        if (username == null) {
            log.error("Atributul 'username' lipsește din OAuth2User: {}", oauthUser.getAttributes());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Atributul 'username' lipsește");
        }
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizator nu a fost găsit: " + username));

        AiModel aiModel = aiModelRepository.findByAiIgnoreCaseAndModelIgnoreCase(ai, model)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Model AI nu a fost găsit pentru ai: " + ai + " și model: " + model));

        user.setAiModel(aiModel);
        userRepository.save(user);

        return ResponseEntity.ok("Preferința AI setată la " + ai + " cu modelul " + model + " pentru utilizatorul " + username + ".");
    }

    /** ON  — Activează tokenul sau selectează unul deja activ */
    @PostMapping("/webhook-token")
    public ResponseEntity<Map<String,String>> enableWebhookToken(
            @AuthenticationPrincipal OAuth2User oauth) {
        try {
            if (oauth == null) {
                log.warn("Acces neautorizat pentru activarea webhook-ului: OAuth2User este null");
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Niciun utilizator OAuth2 autentificat găsit");
            }
            String username = oauth.getAttribute("username");
            if (username == null) {
                log.error("Atributul 'username' lipsește din OAuth2User: {}", oauth.getAttributes());
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Atributul 'username' lipsește");
            }
            log.info("Activare webhook pentru utilizatorul: {}", username);
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizator nu a fost găsit: " + username));

            // Dezactivează tokenurile existente
            webhookTokenRepository.findByUserAndActiveTrue(user)
                    .ifPresent(t -> {
                        t.setActive(false);
                        webhookTokenRepository.save(t);
                        log.info("Token vechi dezactivat pentru utilizatorul: {}", username);
                    });

            // Creează token nou
            WebhookToken wt = new WebhookToken();
            wt.setToken(UUID.randomUUID().toString());
            wt.setUser(user);
            wt.setActive(true);
            wt.setExpiresAt(LocalDateTime.now().plusDays(1));
            webhookTokenRepository.save(wt);
            log.info("Token webhook creat pentru utilizatorul: {}", username);

            return ResponseEntity.ok(Map.of("token", wt.getToken()));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Eroare neașteptată la activarea webhook-ului", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Eroare internă la activarea webhook-ului", e);
        }
    }

    /** OFF — Dezactivează tokenul */
    @DeleteMapping("/webhook-token")
    public ResponseEntity<Void> disableWebhookToken(
            @AuthenticationPrincipal OAuth2User oauth) {
        try {
            if (oauth == null) {
                log.warn("Acces neautorizat pentru dezactivarea webhook-ului: OAuth2User este null");
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Niciun utilizator OAuth2 autentificat găsit");
            }
            String username = oauth.getAttribute("username");
            if (username == null) {
                log.error("Atributul 'username' lipsește din OAuth2User: {}", oauth.getAttributes());
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Atributul 'username' lipsește");
            }
            log.info("Dezactivare webhook pentru utilizatorul: {}", username);
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizator nu a fost găsit: " + username));

            webhookTokenRepository.findByUserAndActiveTrue(user)
                    .ifPresent(t -> {
                        t.setActive(false);
                        webhookTokenRepository.save(t);
                        log.info("Token webhook dezactivat pentru utilizatorul: {}", username);
                    });

            return ResponseEntity.noContent().build(); // Status 204
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Eroare neașteptată la dezactivarea webhook-ului", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Eroare internă la dezactivarea webhook-ului", e);
        }
    }

    /** Verifică tokenul webhook activ */
    @GetMapping("/webhook-token")
    public ResponseEntity<Map<String, String>> getWebhookToken(
            @AuthenticationPrincipal OAuth2User oauth) {
        try {
            if (oauth == null) {
                log.warn("Acces neautorizat pentru verificarea webhook-ului: OAuth2User este null");
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Niciun utilizator OAuth2 autentificat găsit");
            }
            String username = oauth.getAttribute("username");
            if (username == null) {
                log.error("Atributul 'username' lipsește din OAuth2User: {}", oauth.getAttributes());
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Atributul 'username' lipsește");
            }
            log.info("Verificare token webhook pentru utilizatorul: {}", username);
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizator nu a fost găsit: " + username));

            return webhookTokenRepository.findByUserAndActiveTrue(user)
                    .map(t -> ResponseEntity.ok(Map.of("token", t.getToken())))
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Eroare neașteptată la verificarea webhook-ului", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Eroare internă la verificarea webhook-ului", e);
        }
    }

    @GetMapping("/{username}/aspects")
    public ResponseEntity<List<String>> getReviewAspects(@PathVariable String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizator nu a fost găsit: " + username));
        List<String> aspects = user.getReviewAspectsList();
        if (aspects == null || aspects.isEmpty()) {
            aspects = Arrays.asList(
                    "Summary",
                    "Syntax & Style",
                    "Correctness & Logic",
                    "Potential Bugs",
                    "Security Considerations",
                    "Performance & Scalability",
                    "Maintainability & Readability",
                    "Documentation & Comments",
                    "Best practices & Design Principles",
                    "Recommendations"
            );
        }
        return ResponseEntity.ok(aspects);
    }

    /**
     * Actualizează aspectele dorite de utilizator pentru revizuirea AI.
     * Dacă lista este goală, se păstrează valorile implicite din DB (toate 10).
     */
    @PutMapping("/{username}/aspects")
    public ResponseEntity<Void> updateReviewAspects(
            @PathVariable String username,
            @RequestBody List<String> aspects) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizator nu a fost găsit: " + username));

        if (aspects == null || aspects.isEmpty()) {
            // Default values
        } else {
            user.setReviewAspectsList(aspects);
        }

        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/user/repos/{username}
     * Returns the list of distinct repository names the user has given feedback on.
     */
    @GetMapping("/repos/{username}")
    public ResponseEntity<List<String>> getUserRepos(@PathVariable String username) {
        userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "User not found: " + username));

        List<String> repos = feedbackRepository.findDistinctRepoFullNamesByUsername(username);
        return ResponseEntity.ok(repos);
    }
}