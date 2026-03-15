-- Data is seeded programmatically via DataSeeder.java
-- This file is kept for reference and manual overrides if needed

-- Default charge_type for existing expenses
UPDATE inspection_expenses SET charge_type = 'EXPENSE', quantity = 1, show_on_documents = true, update_related = false WHERE charge_type IS NULL;
