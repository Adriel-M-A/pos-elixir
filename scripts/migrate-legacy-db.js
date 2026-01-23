const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Rutas de Bases de Datos
const OLD_DB_PATH = path.resolve(__dirname, '../../heladeria-ventas-control/heladeria.db');
const NEW_DB_PATH = path.resolve(__dirname, '../data/database.db');

console.log('--- Iniciando Migración ---');
console.log(`Base de Datos Antigua: ${OLD_DB_PATH}`);
console.log(`Base de Datos Nueva: ${NEW_DB_PATH}`);

if (!fs.existsSync(OLD_DB_PATH)) {
    console.error('ERROR: No se encuentra la base de datos antigua.');
    process.exit(1);
}

if (!fs.existsSync(NEW_DB_PATH)) {
    console.error('ERROR: No se encuentra la base de datos nueva. Asegúrate de iniciar la app al menos una vez para que cree la estructura básica.');
    process.exit(1);
}

const oldDb = new Database(OLD_DB_PATH, { readonly: true });
const newDb = new Database(NEW_DB_PATH);

// Mapeo de Métodos de Pago
const PAYMENT_MAP = {
    'efectivo': 1,
    'tarjeta': 2,
    'transferencia': 3,
    'mercado_pago': 3, // Mercado Pago -> Transferencia
    'mercado pago': 3, // Variación
    'mercadopago': 3   // Variación
};

function migrate() {
    try {
        // 0. ASEGURAR ESQUEMA (Columna Source)
        // Verificamos si existe la columna 'source' en 'sales', si no, la creamos.
        // Esto es útil si la migración interna de la app no corrió aún.
        const tableInfo = newDb.pragma('table_info(sales)');
        const hasSource = tableInfo.some(col => col.name === 'source');

        if (!hasSource) {
            console.log("AVISO: Agregando columna 'source' faltante a la tabla 'sales'...");
            try {
                newDb.prepare("ALTER TABLE sales ADD COLUMN source TEXT DEFAULT 'LOCAL'").run();
            } catch (e) {
                console.warn("No se pudo agregar la columna 'source' (quizás ya existe o error paralelo):", e.message);
            }
        }

        // 1. LIMPIEZA DE BASE DE DATOS
        console.log('Limpiando datos existentes (Manteniedo Usuarios y Configuración)...');
        newDb.exec(`
      DELETE FROM sale_items;
      DELETE FROM sale_promotions;
      DELETE FROM sales;
      DELETE FROM promotion_products;
      DELETE FROM promotions;
      DELETE FROM products;
      DELETE FROM categories;
      -- No borramos users ni payment_methods
      DELETE FROM sqlite_sequence WHERE name IN ('sales', 'sale_items', 'products', 'categories', 'promotions');
    `);
        console.log('Base de datos limpia.');

        // 2. Migrar Productos (Presentations -> Products)
        console.log('Migrando Productos...');
        const presentations = oldDb.prepare('SELECT * FROM presentations').all();

        const insertProduct = newDb.prepare(`
      INSERT INTO products (name, category_id, price, stock, is_stock_controlled, min_stock, is_active, created_at, product_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        const now = new Date().toISOString();
        let productsCount = 0;

        const productTransaction = newDb.transaction(() => {
            for (const p of presentations) {
                insertProduct.run(
                    p.name,
                    null, // category_id = NULL (Sin Categoría)
                    p.price_local,
                    0, // stock
                    0, // is_stock_controlled
                    0, // min_stock
                    1, // is_active
                    now,
                    'UNIT' // product_type default
                );
                productsCount++;
            }
        });

        productTransaction();
        console.log(`Productos migrados: ${productsCount}`);

        // 3. Migrar Ventas
        console.log('Migrando Ventas...');
        const oldSales = oldDb.prepare('SELECT * FROM sales').all();

        const insertSale = newDb.prepare(`
      INSERT INTO sales (total, discount_total, final_total, payment_method_id, status, created_at, created_by, created_by_name, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        const insertSaleItem = newDb.prepare(`
      INSERT INTO sale_items (sale_id, product_id, product_name, unit_price, quantity, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        // Cachear IDs de productos nuevos para búsqueda rápida
        const productsList = newDb.prepare('SELECT id, name FROM products').all();
        // Mapa: Nombre -> ID
        const productMap = new Map(productsList.map(p => [p.name, p.id]));

        let salesCount = 0;

        const migrationTransaction = newDb.transaction(() => {
            for (const sale of oldSales) {
                // Mapear método de pago
                let paymentMethodName = sale.payment_method ? sale.payment_method.toLowerCase() : 'efectivo';
                let paymentId = PAYMENT_MAP[paymentMethodName] || 1;

                // Mapear Source (Type)
                // Valores reales encontrados: 'local', 'pedidos_ya'
                let source = 'LOCAL';
                const type = sale.type ? sale.type.toLowerCase() : '';

                if (type.includes('pedido') || type === 'pedidos_ya') {
                    source = 'ONLINE';
                }

                // Insertar Venta
                const res = insertSale.run(
                    sale.total, // total
                    0,          // discount_total
                    sale.total, // final_total
                    paymentId,
                    'active',   // status
                    sale.date,  // created_at
                    1,          // created_by (Admin)
                    'Administrador', // created_by_name
                    source      // source
                );
                const newSaleId = res.lastInsertRowid;

                // Insertar Item
                // Buscamos el ID del producto recién migrado
                const productId = productMap.get(sale.presentation_name);

                if (productId) {
                    insertSaleItem.run(
                        newSaleId,
                        productId,
                        sale.presentation_name,
                        sale.price_base,
                        sale.quantity,
                        sale.price_base * sale.quantity // subtotal
                    );
                } else {
                    // Si no encontramos el producto (raro si acabamos de migrarlos todos), logueamos
                    console.warn(`[WARN] Producto no encontrado para venta ID ${sale.id}: ${sale.presentation_name}`);
                    // Opcional: Insertar un item "Huérfano" o genérico si se requiere integridad estricta de FK
                }

                salesCount++;
            }
        });

        migrationTransaction();
        console.log(`Ventas migradas: ${salesCount}`);

        console.log('--- Migración Completada con Éxito ---');

    } catch (error) {
        console.error('Error FATAL durante la migración:', error);
    } finally {
        oldDb.close();
        newDb.close();
    }
}

migrate();
