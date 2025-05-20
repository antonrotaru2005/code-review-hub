--changeset antonrotaru:010-webhook-token-active-flag
ALTER TABLE webhook_token
    ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE webhook_token
    DROP COLUMN used;