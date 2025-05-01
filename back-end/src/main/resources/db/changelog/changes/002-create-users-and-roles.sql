--liquibase formatted sql

--changeset antonrotaru:002-create-users-and-roles
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    bitbucket_uuid VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(200),
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id),
    CONSTRAINT fk_role FOREIGN KEY(role_id) REFERENCES roles(id),
    CONSTRAINT pk_user_roles PRIMARY KEY(user_id, role_id)
);

--rollback DROP TABLE user_roles, DROP TABLE users, DROP TABLE roles;
