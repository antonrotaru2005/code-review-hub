--liquibase formatted sql
--changeset antonrotaru:014-add-password-column-team
ALTER TABLE team
    ADD COLUMN password VARCHAR(255) NOT NULL;

--rollback ALTER TABLE team DROP COLUMN password;
