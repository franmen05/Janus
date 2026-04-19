CREATE TABLE IF NOT EXISTS account_partners (
    socio_id BIGINT NOT NULL,
    associated_account_id BIGINT NOT NULL,
    PRIMARY KEY (socio_id, associated_account_id),
    FOREIGN KEY (socio_id) REFERENCES accounts(id),
    FOREIGN KEY (associated_account_id) REFERENCES accounts(id)
);
