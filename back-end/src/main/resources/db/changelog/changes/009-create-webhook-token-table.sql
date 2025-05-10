--liquibase formatted sql

--changeset antonrotaru:009-create-webhook-token-table

CREATE TABLE webhook_token (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP,
    CONSTRAINT fk_webhook_token_user FOREIGN KEY (user_id) REFERENCES users(id)
);
