--liquibase formatted sql
--changeset antonrotaru:011
ALTER TABLE users
    ADD COLUMN review_aspects TEXT NOT NULL
        DEFAULT 'Summary,Syntax & Style,Correctness & Logic,Potential Bugs,Security Considerations,Performance & Scalability,Maintainability & Readability,Documentation & Comments,Best Practices & Design Principles,Recommendations';
