-- Agregar columnas para control de stock
ALTER TABLE products ADD COLUMN is_stock_controlled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 0;
-- La columna 'stock' ya existe en la definición inicial de la tabla
