--liquibase formatted sql

-- changeset antonrotaru:005-add-repo-full-name-to-feedback
ALTER TABLE feedback
    ADD COLUMN repo_full_name VARCHAR(255) NOT NULL;
