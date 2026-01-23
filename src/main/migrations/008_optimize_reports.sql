-- Optimizar consultas de reportes
-- 1. Índice para mejorar agrupaciones por producto en sale_items (Top Products)
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- 2. Índice para monitor de bajo stock
-- Ayuda a filtrar rápidamente los productos que sí controlan stock y están activos
CREATE INDEX IF NOT EXISTS idx_products_stock_monitor ON products(is_stock_controlled, is_active);
