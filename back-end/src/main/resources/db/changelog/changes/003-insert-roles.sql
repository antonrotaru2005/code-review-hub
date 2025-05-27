-- liquibase formatted sql

-- changeset antonrotaru:003-insert-roles
INSERT INTO Roles (name) VALUES ('ROLE_USER');
INSERT INTO Roles (name) VALUES ('ROLE_ADMIN');
INSERT INTO Roles (name) VALUES ('ROLE_TEAM_ADMIN')