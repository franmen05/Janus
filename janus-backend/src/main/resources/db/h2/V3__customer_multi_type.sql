-- Create join table for customer types
CREATE TABLE customer_types (
    customer_id BIGINT NOT NULL,
    customer_type VARCHAR(50) NOT NULL,
    CONSTRAINT fk_customer_types_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT uk_customer_type UNIQUE (customer_id, customer_type)
);

-- Migrate existing data from single column to join table
INSERT INTO customer_types (customer_id, customer_type)
SELECT id, customerType FROM customers WHERE customerType IS NOT NULL;

-- Drop old column
ALTER TABLE customers DROP COLUMN customerType;
