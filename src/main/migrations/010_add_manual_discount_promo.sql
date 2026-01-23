-- Insert system promotion for manual discounts
-- ID 9999 is reserved for manual discounts
INSERT OR IGNORE INTO promotions (id, name, discount_type, discount_value, is_active, created_at) 
VALUES (9999, 'Descuento Manual', 'FIXED_AMOUNT', 0, 1, datetime('now'));
