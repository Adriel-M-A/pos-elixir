-- Cambiar tipo de dato de quantity en sale_items de INTEGER a REAL para soportar peso
-- SQLite no soporta ALTER COLUMN, se debe recrear la tabla

-- 1. Crear tabla temporal
CREATE TABLE IF NOT EXISTS sale_items_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    unit_price REAL NOT NULL,
    quantity REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- 2. Copiar datos
INSERT INTO sale_items_new (id, sale_id, product_id, product_name, unit_price, quantity, subtotal)
SELECT id, sale_id, product_id, product_name, unit_price, quantity, subtotal
FROM sale_items;

-- 3. Eliminar tabla anterior
DROP TABLE sale_items;

-- 4. Renombrar tabla nueva
ALTER TABLE sale_items_new RENAME TO sale_items;

-- 5. Recrear índices
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
