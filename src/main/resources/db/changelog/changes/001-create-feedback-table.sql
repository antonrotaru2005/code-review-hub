-- liquibase formatted sql

-- changeset antonrotaru:001
CREATE TABLE feedback (
    id BIGSERIAL PRIMARY KEY,
    pr_id BIGINT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_key VARCHAR(100)
);