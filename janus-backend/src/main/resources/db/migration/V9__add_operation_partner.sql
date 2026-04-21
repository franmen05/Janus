ALTER TABLE operations ADD COLUMN partner_id BIGINT;
ALTER TABLE operations ADD CONSTRAINT fk_operation_partner
    FOREIGN KEY (partner_id) REFERENCES accounts(id);
