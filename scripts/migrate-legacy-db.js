const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Rutas de Bases de Datos
const OLD_DB_PATH = path.resolve(__dirname, '../../heladeria-ventas-control/heladeria.db');
const NEW_DB_PATH = path.resolve(__dirname, '../data/database.db');

console.log('--- Iniciando Migración (Versión Final Corregida) ---');
console.log(`Base de Datos Antigua: ${OLD_DB_PATH}`);
console.log(`Base de Datos Nueva: ${NEW_DB_PATH}`);

if (!fs.existsSync(OLD_DB_PATH)) {
    console.error('ERROR: No se encuentra la base de datos antigua.');
    process.exit(1);
}

if (!fs.existsSync(NEW_DB_PATH)) {
    console.error('ERROR: No se encuentra la base de datos nueva. Asegúrate de iniciar la app al menos una vez.');
    process.exit(1);
}

const oldDb = new Database(OLD_DB_PATH, { readonly: true });
const newDb = new Database(NEW_DB_PATH);

// Helper para formatear fecha igual que la app (Local Time YYYY-MM-DDTHH:mm:ss)
// Convierte la fecha UTC de la BD vieja a la Hora Local del sistema actual
function toLocalISO(dateInput) {
    const d = dateInput ? new Date(dateInput) : new Date();
    // 'sv-SE' formatea como YYYY-MM-DD HH:mm:ss
    return d.toLocaleString('sv-SE').replace(' ', 'T');
}

// Mapeo de Métodos de Pago (Actualizado con valores reales de la BD)
const PAYMENT_MAP = {
    'efectivo': 1,
    'tarjeta': 2,
    'transferencia': 3,
    'mercado_pago': 3, // Corregido: snake_case encontrado en BD
    'mercado pago': 3,
    'mercadopago': 3
};

function migrate() {
    try {
        // ---------------------------------------------------------
        // 0. PREPARACIÓN Y AUTO-CORRECCIÓN DE ESQUEMA
        // ---------------------------------------------------------

        // 0.1 Asegurar columna 'source' en 'sales'
        try {
            const tableInfo = newDb.pragma('table_info(sales)');
            const hasSource = tableInfo.some(col => col.name === 'source');

            if (!hasSource) {
                console.log("AVISO: Agregando columna 'source' faltante...");
                newDb.prepare("ALTER TABLE sales ADD COLUMN source TEXT DEFAULT 'LOCAL'").run();
            }
        } catch (e) {
            console.warn("Advertencia al verificar columna source:", e.message);
        }

        // 0.2 Marcar migración 009 como completada para evitar conflictos al iniciar la App
        try {
            // Aseguramos que la tabla _migrations exista (el bootstrap de la app la crea)
            const migrationsTable = newDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'").get();
            if (migrationsTable) {
                newDb.prepare("INSERT OR IGNORE INTO _migrations (name) VALUES ('009_add_sale_source.sql')").run();
                console.log("Conflicto de migración prevenido (009 marcada como lista).");
            }
        } catch (e) {
            console.warn("No se pudo actualizar _migrations (no crítico si la app ya corrió):", e.message);
        }

        // ---------------------------------------------------------
        // 1. LIMPIEZA TOTAL
        // ---------------------------------------------------------
        console.log('Limpiando datos existentes...');
        newDb.exec(`
            DELETE FROM sale_items;
            DELETE FROM sale_promotions;
            DELETE FROM sales;
            DELETE FROM promotion_products;
            DELETE FROM promotions;
            DELETE FROM products;
            DELETE FROM categories;
            DELETE FROM sqlite_sequence WHERE name IN ('sales', 'sale_items', 'products', 'categories', 'promotions');
        `);
        console.log('Base de datos limpia.');

        // ---------------------------------------------------------
        // 2. MIGRAR PRODUCTOS
        // ---------------------------------------------------------
        console.log('Migrando Productos...');
        const presentations = oldDb.prepare('SELECT * FROM presentations').all();

        const insertProduct = newDb.prepare(`
            INSERT INTO products (name, category_id, price, stock, is_stock_controlled, min_stock, is_active, created_at, product_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // Usamos fecha actual local para la creación de productos
        const now = toLocalISO(new Date());
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

        // ---------------------------------------------------------
        // 3. MIGRAR VENTAS
        // ---------------------------------------------------------
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

        // Cachear IDs de productos nuevos
        const productsList = newDb.prepare('SELECT id, name FROM products').all();
        const productMap = new Map(productsList.map(p => [p.name, p.id]));

        let salesCount = 0;

        const migrationTransaction = newDb.transaction(() => {
            for (const sale of oldSales) {
                // A) Mapear Método de Pago
                let paymentMethodName = sale.payment_method ? sale.payment_method.toLowerCase() : 'efectivo';
                let paymentId = PAYMENT_MAP[paymentMethodName] || 1; // Default Efectivo

                // B) Mapear Source (Type) -> Detectando 'pedidos_ya'
                let source = 'LOCAL';
                const type = sale.type ? sale.type.toLowerCase() : '';
                if (type.includes('pedido') || type === 'pedidos_ya') {
                    source = 'ONLINE';
                }

                // C) Convertir Fecha a Local Time
                const localDate = toLocalISO(sale.date);

                // Insertar Venta
                const res = insertSale.run(
                    sale.total,
                    0,          // discount_total
                    sale.total, // final_total
                    paymentId,
                    'active',   // status
                    localDate,  // created_at (CORREGIDO)
                    1,          // created_by (Admin)
                    'Administrador',
                    source
                );
                const newSaleId = res.lastInsertRowid;

                // Insertar Item
                const productId = productMap.get(sale.presentation_name);
                if (productId) {
                    insertSaleItem.run(
                        newSaleId,
                        productId,
                        sale.presentation_name,
                        sale.price_base,
                        sale.quantity,
                        sale.price_base * sale.quantity
                    );
                } else {
                    // console.warn si es necesario, silenciado para no ensuciar output masivo
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
