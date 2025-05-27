--liquibase formatted sql

-- changeset antonrotaru:013-create-team-table
-- comment: create team table and join table for user–team relationships

CREATE TABLE team (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by BIGINT,
    CONSTRAINT fk_team_created_by
      FOREIGN KEY (created_by)
      REFERENCES users(id)
);

CREATE TABLE user_team (
    user_id BIGINT   NOT NULL,
    team_id BIGINT   NOT NULL,
    PRIMARY KEY (user_id, team_id),
    CONSTRAINT fk_user_team_user
      FOREIGN KEY (user_id)
      REFERENCES users(id),
    CONSTRAINT fk_user_team_team
      FOREIGN KEY (team_id)
      REFERENCES team(id)
);
