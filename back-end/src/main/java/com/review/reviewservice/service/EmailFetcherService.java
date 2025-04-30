package com.review.reviewservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Objects;

/**
 * Service responsabil pentru extragerea adresei de email a utilizatorului
 * din endpoint-ul Bitbucket /2.0/user/emails, folosind token-ul OAuth2.
 */
@Slf4j
@Service
public class EmailFetcherService {

    private static final String EMAILS_URL = "https://api.bitbucket.org/2.0/user/emails";
    private final RestTemplate restTemplate;

    public EmailFetcherService() {
        this.restTemplate = new RestTemplate();
    }

    public String fetchPrimaryEmail(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    EMAILS_URL,
                    HttpMethod.GET,
                    entity,
                    JsonNode.class
            );

            JsonNode values = Objects.requireNonNull(response.getBody()).path("values");
            if (values.isArray()) {
                // găsește email primary confirmat
                for (JsonNode node : values) {
                    boolean primary   = node.path("is_primary").asBoolean(false);
                    boolean confirmed = node.path("is_confirmed").asBoolean(false);
                    if (primary && confirmed) {
                        return node.path("email").asText(null);
                    }
                }
                // fallback la primul email
                if (!values.isEmpty()) {
                    return values.get(0).path("email").asText(null);
                }
            }
        } catch (Exception ex) {
            log.warn("EmailFetcherService: nu am putut extrage email-ul: {}", ex.getMessage());
        }
        return null;
    }
}
