-- liquibase formatted sql

-- changeset antonrotaru:008-add-user-avatar-and-name
-- comment: Add name and avatar columns to users table and update evamerculov-admin

ALTER TABLE users ADD COLUMN name VARCHAR(100);
ALTER TABLE users ADD COLUMN avatar VARCHAR(255);

-- rollback ALTER TABLE users DROP COLUMN name;
-- rollback ALTER TABLE users DROP COLUMN avatar;