-- V10: Account code auto-generation configuration (singleton)

CREATE TABLE account_code_config (
    id BIGINT NOT NULL,
    prefix VARCHAR(255) NOT NULL,
    separator VARCHAR(5) NOT NULL,
    padding_length INTEGER NOT NULL,
    enabled BOOLEAN NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6),
    PRIMARY KEY (id)
);

INSERT INTO account_code_config (id, prefix, separator, padding_length, enabled, created_at, updated_at)
VALUES (1, 'ACC', '-', 5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
