-- Rename deposito_id column to warehouse_id in operations table
-- This migration supports the renaming of the "deposito" concept to "warehouse"

ALTER TABLE operations DROP CONSTRAINT IF EXISTS FK_operations_deposito_id;

ALTER TABLE operations RENAME COLUMN deposito_id TO warehouse_id;

ALTER TABLE operations ADD CONSTRAINT FK_operations_warehouse_id FOREIGN KEY (warehouse_id) REFERENCES depositos (id);
