-- liquibase formatted sql

-- changeset antonrotaru:007-update-users-table
ALTER TABLE users
    ADD COLUMN ai_model_id BIGINT DEFAULT 1,
    ADD CONSTRAINT fk_ai_model
        FOREIGN KEY (ai_model_id)
            REFERENCES ai_models(id)
            ON DELETE SET NULL;