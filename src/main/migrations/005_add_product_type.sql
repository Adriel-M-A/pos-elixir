-- Agregar columna product_type para diferenciar venta por unidad y por peso
ALTER TABLE products ADD COLUMN product_type TEXT NOT NULL DEFAULT 'UNIT' CHECK (product_type IN ('UNIT', 'WEIGHT'));
