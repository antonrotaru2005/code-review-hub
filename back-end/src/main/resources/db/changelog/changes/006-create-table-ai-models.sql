-- liquibase formatted sql

-- changeset antonrotaru:006-create-table-ai-models
CREATE TABLE ai_models (
    id BIGSERIAL PRIMARY KEY,
    ai VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL
);

-- Insert initial values
INSERT INTO ai_models (ai, model) VALUES ('chatgpt', 'gpt-4o-mini');
INSERT INTO ai_models (ai, model) VALUES ('chatgpt', 'gpt-3.5-turbo');
INSERT INTO ai_models (ai, model) VALUES ('grok', 'grok');