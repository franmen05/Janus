ALTER TABLE accounts ADD CONSTRAINT uq_account_name UNIQUE (name);
ALTER TABLE accounts ADD CONSTRAINT uq_account_code UNIQUE ("accountCode");
