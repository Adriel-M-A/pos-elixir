-- Esquema inicial de la base de datos

-- Categorías
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Productos
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Métodos de Pago
CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);

-- Ventas
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total REAL NOT NULL,
    discount_total REAL NOT NULL,
    final_total REAL NOT NULL,
    payment_method_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    cancelled_at TEXT,
    cancellation_reason TEXT,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method_id);

-- Items de Venta
CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- Promociones
CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    discount_type TEXT NOT NULL,
    discount_value REAL NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_name ON promotions(name);

-- Productos en Promociones
CREATE TABLE IF NOT EXISTS promotion_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    promotion_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    required_qty INTEGER NOT NULL,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE INDEX IF NOT EXISTS idx_promotion_products_promotion ON promotion_products(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_products_product ON promotion_products(product_id);

-- Promociones aplicadas a Ventas
CREATE TABLE IF NOT EXISTS sale_promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    promotion_id INTEGER NOT NULL,
    promotion_name TEXT NOT NULL,
    discount_amount REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);
CREATE INDEX IF NOT EXISTS idx_sale_promotions_sale_id ON sale_promotions(sale_id);

-- Seed Métodos de Pago por Defecto
INSERT OR IGNORE INTO payment_methods (name, created_at) VALUES 
('Efectivo', datetime('now', 'localtime')),
('Tarjeta', datetime('now', 'localtime')),
('Transferencia', datetime('now', 'localtime'));
