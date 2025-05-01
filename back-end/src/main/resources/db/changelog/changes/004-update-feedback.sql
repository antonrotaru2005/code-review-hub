-- liquibase formatted sql

-- changeset antonrotaru:004-update-feedback
ALTER TABLE feedback DROP COLUMN user_key;
ALTER TABLE feedback ADD COLUMN user_id BIGINT NOT NULL;
ALTER TABLE feedback
    ADD CONSTRAINT fk_feedback_user
        FOREIGN KEY (user_id) REFERENCES users(id);

