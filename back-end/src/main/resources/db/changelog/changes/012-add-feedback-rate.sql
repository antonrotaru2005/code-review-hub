--liquibase formatted sql
--changeset antonrotaru:012-add-feedback-rate
ALTER TABLE feedback
  ADD COLUMN rate INT NOT NULL DEFAULT 0;
