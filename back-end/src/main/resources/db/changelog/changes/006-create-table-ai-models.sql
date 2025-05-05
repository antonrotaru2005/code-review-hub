-- liquibase formatted sql

-- changeset antonrotaru:006-create-table-ai-models
CREATE TABLE ai_models (
    id BIGSERIAL PRIMARY KEY,
    ai VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    CONSTRAINT uk_ai_models_ai_model UNIQUE (ai, model)
);

-- Insert values for ChatGPT models
INSERT INTO ai_models (ai, model) VALUES ('ChatGPT', 'gpt-4o');
INSERT INTO ai_models (ai, model) VALUES ('ChatGPT', 'gpt-4-turbo');
INSERT INTO ai_models (ai, model) VALUES ('ChatGPT', 'o3');
INSERT INTO ai_models (ai, model) VALUES ('ChatGPT', 'o4-mini');

-- Insert values for Grok models
INSERT INTO ai_models (ai, model) VALUES ('Grok', 'grok');
INSERT INTO ai_models (ai, model) VALUES ('Grok', 'grok-3');

-- Insert values for Copilot models
INSERT INTO ai_models (ai, model) VALUES ('Copilot', 'copilot-codex');
INSERT INTO ai_models (ai, model) VALUES ('Copilot', 'copilot-gpt-4');

-- Insert values for Gemini models
INSERT INTO ai_models (ai, model) VALUES ('Gemini', 'gemini-1.5-pro');
INSERT INTO ai_models (ai, model) VALUES ('Gemini', 'gemini-1.5-flash');
INSERT INTO ai_models (ai, model) VALUES ('Gemini', 'gemini-2.5-pro')