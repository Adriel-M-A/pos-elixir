const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ==========================================
// CONFIGURACIÓN DE SEED (1 MILLÓN DE VENTAS)
// ==========================================
// Meta: 1,000,000 de ventas
// Rango: 01-Jan-2025 al 16-Jan-2026 (aprox 380 días)
const START_DATE = new Date('2025-01-01T00:00:00');
const END_DATE = new Date('2026-01-16T23:59:59');
const TOTAL_TARGET_SALES = 1000000;
const BATCH_SIZE = 5000;
const DB_PATH = path.join(process.cwd(), 'data', 'database.db');

// Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// ==========================================
// DATASETS
// ==========================================

// ==========================================
// DATASETS
// ==========================================

const unitProductsRaw = require('./products-unit.json');
const weightProductsRaw = require('./products-weight.json');

// Helper to normalize categories (capitalize and fix accents)
const normalizeCategory = (cat) => {
    const map = {
        'almacen': 'Almacén',
        'fiambreria': 'Fiambrería',
        'carniceria': 'Carnicería',
        'verduleria': 'Verdulería',
        'limpieza': 'Limpieza',
        'bebidas': 'Bebidas',
        'dulces': 'Dulces',
        'perfumeria': 'Perfumería',
        'frutas': 'Frutas',
        'verduras': 'Verduras',
        'golosinas': 'Golosinas', // In case it appears
        'snacks': 'Snacks'
    };
    if (map[cat.toLowerCase()]) return map[cat.toLowerCase()];
    return cat.charAt(0).toUpperCase() + cat.slice(1);
};

// Extract unique categories dynamically
const allCategoriesSet = new Set();
[...unitProductsRaw, ...weightProductsRaw].forEach(p => {
    if (p.category) allCategoriesSet.add(normalizeCategory(p.category));
});
const CATEGORIES = Array.from(allCategoriesSet);

// Prepare products lists
const UNIT_PRODUCTS = unitProductsRaw.map(p => ({
    ...p,
    category: normalizeCategory(p.category),
    minStock: p.minStock || (Math.random() < 0.2 ? 10 : 0) // Add default minStock logic if missing
}));

const WEIGHT_PRODUCTS = weightProductsRaw.map(p => ({
    ...p,
    category: normalizeCategory(p.category)
}));

// Updated Promotions with multiple product matching based on NEW JSON names
const PROMOTIONS = [
    {
        name: 'Promo Desayuno (Yerba + Azúcar)',
        discount: 500,
        matches: ['Yerba mate 1kg', 'Azúcar 1kg']
    },
    {
        name: 'Promo 2x1 Coca Cola',
        discount: 1600,
        matches: ['Coca Cola plástico 1L']
    },
    {
        name: 'Descuento Asado',
        discount: 1000,
        matches: ['Asado']
    },
    {
        name: 'Promo Limpieza (Detergente + Lavandina)',
        discount: 400,
        matches: ['Detergente', 'Lavandina 1L']
    }
];

// ==========================================
// SEED LOGIC
// ==========================================

async function seed() {
    console.log('🌱 Iniciando Seed Mejorado (Stock Control + Promos Linked)...');
    console.log(`   Rango: ${START_DATE.toLocaleDateString()} -> ${END_DATE.toLocaleDateString()}`);

    if (!fs.existsSync(DB_PATH)) {
        console.error('❌ Base de datos no encontrada.');
        process.exit(1);
    }

    const db = new Database(DB_PATH);

    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = OFF');
    db.pragma('cache_size = 10000');
    db.pragma('foreign_keys = OFF');

    // Limpieza
    console.log('🧹 Limpiando DB...');
    const tables = ['sale_promotions', 'sale_items', 'sales', 'promotion_products', 'promotions', 'products', 'categories'];
    tables.forEach(t => db.prepare(`DELETE FROM ${t}`).run());
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('sale_promotions', 'sale_items', 'sales', 'promotion_products', 'promotions', 'products', 'categories')").run();

    db.pragma('foreign_keys = ON');

    // 1. Categorías
    console.log('📦 Categorías...');
    const insertCat = db.prepare('INSERT INTO categories (name, is_active, created_at) VALUES (?, 1, ?)');
    const catMap = new Map();
    const nowStr = formatLocalDate(new Date());

    CATEGORIES.forEach(cat => {
        const res = insertCat.run(cat, nowStr);
        catMap.set(cat, Number(res.lastInsertRowid));
    });

    // 2. Productos
    console.log('🍦 Productos (con Control de Stock)...');
    // Schema: name, category_id, price, stock, is_active, created_at, product_type, is_stock_controlled, min_stock
    const insertProd = db.prepare(`
        INSERT INTO products (name, category_id, price, stock, is_active, created_at, product_type, is_stock_controlled, min_stock) 
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
    `);

    const allProducts = []; // Para randomizer de ventas
    const productMap = new Map(); // Name -> ID (Para promos)

    // Insertar Unitarios
    UNIT_PRODUCTS.forEach(p => {
        // 40% chance of stock control if not specified, or if minStock is present assume control
        const isControlled = p.minStock ? 1 : (Math.random() < 0.4 ? 1 : 0);
        // Si es controlado, damos MUCHO stock inicial para que el seed no falle por falta de stock
        const initialStock = isControlled ? 2000000 : 0;
        const minStock = p.minStock || 10;

        const res = insertProd.run(p.name, catMap.get(p.category), p.price, initialStock, nowStr, 'UNIT', isControlled, minStock);
        const id = Number(res.lastInsertRowid);

        const prodObj = { id, ...p, type: 'UNIT' };
        allProducts.push(prodObj);
        productMap.set(p.name, prodObj);
    });

    // Insertar Peso
    WEIGHT_PRODUCTS.forEach(p => {
        // Peso nunca controlamos stock en este seed para simplificar
        const res = insertProd.run(p.name, catMap.get(p.category), p.price, 0, nowStr, 'WEIGHT', 0, 0);
        const id = Number(res.lastInsertRowid);

        const prodObj = { id, ...p, type: 'WEIGHT' };
        allProducts.push(prodObj);
        productMap.set(p.name, prodObj);
    });

    // 3. Promociones
    console.log('🎁 Promociones (Linked Products)...');
    const insertPromo = db.prepare('INSERT INTO promotions (name, discount_type, discount_value, is_active, created_at) VALUES (?, ?, ?, 1, ?)');
    const insertPromoProd = db.prepare('INSERT INTO promotion_products (promotion_id, product_id, required_qty) VALUES (?, ?, ?)');

    const activePromos = []; // Para usar en ventas

    PROMOTIONS.forEach(p => {
        const res = insertPromo.run(p.name, 'FIXED', p.discount, nowStr);
        const promoId = Number(res.lastInsertRowid);

        p.matches.forEach(matchName => {
            const prod = productMap.get(matchName);
            if (prod) {
                insertPromoProd.run(promoId, prod.id, 1);
            }
        });

        activePromos.push({
            id: promoId,
            name: p.name,
            discount: p.discount,
            matches: p.matches
        });
    });

    // 4. Generación de Ventas
    console.log(`💰 Generando ${TOTAL_TARGET_SALES.toLocaleString()} ventas...`);

    const insertSale = db.prepare(`
        INSERT INTO sales (total, discount_total, final_total, payment_method_id, status, created_at, created_by_name) 
        VALUES (@total, @discount_total, @final_total, @payment_method_id, 'active', @created_at, 'Admin Seed')
    `);

    const insertItem = db.prepare(`
        INSERT INTO sale_items (sale_id, product_id, product_name, unit_price, quantity, subtotal)
        VALUES (@sale_id, @product_id, @product_name, @unit_price, @quantity, @subtotal)
    `);

    const insertSalePromo = db.prepare(`
        INSERT INTO sale_promotions (sale_id, promotion_id, promotion_name, discount_amount)
        VALUES (@sale_id, @promotion_id, @promotion_name, @discount_amount)
    `);

    // Statement para actualizar stock real (Opcional si queremos ver stock bajar, pero ralentiza seed masivo)
    // Para 1M de ventas es mejor NO actualizar stock fila por fila aquí, 
    // pero como asignamos stock inicial gigante, podrías hacerlo si quisieras realismo total.
    // Vamos a omitirlo por performance, ya que el historial de ventas es lo que importa para reportes vs stock actual.
    // El stock final se "simula" que quedó en lo que quedó.

    const totalDays = Math.ceil((END_DATE - START_DATE) / (1000 * 60 * 60 * 24)) + 1;
    const salesPerDay = Math.ceil(TOTAL_TARGET_SALES / totalDays);

    let processedSales = 0;
    const batchSales = [];

    const flushBatch = db.transaction((sales) => {
        for (const s of sales) {
            const info = insertSale.run({
                total: s.total,
                discount_total: s.discountTotal,
                final_total: s.finalTotal,
                payment_method_id: s.paymentMethodId,
                created_at: s.createdAt
            });
            const saleId = info.lastInsertRowid;

            for (const item of s.items) insertItem.run({ sale_id: saleId, ...item });
            for (const promo of s.promotions) insertSalePromo.run({ sale_id: saleId, ...promo });
        }
    });

    let currentDate = new Date(START_DATE);

    while (currentDate <= END_DATE) {
        const day = currentDate.getDay();
        const isWeekend = day === 0 || day === 6;
        const dailyTarget = isWeekend ? Math.floor(salesPerDay * 1.5) : Math.floor(salesPerDay * 0.8);

        for (let i = 0; i < dailyTarget; i++) {
            if (processedSales >= TOTAL_TARGET_SALES) break;

            const saleTime = new Date(currentDate);
            const hourRand = Math.random();
            let hour;
            if (hourRand < 0.2) hour = randomInt(9, 12);
            else if (hourRand < 0.5) hour = randomInt(13, 17);
            else hour = randomInt(18, 22);

            saleTime.setHours(hour, randomInt(0, 59), randomInt(0, 59));

            const numItems = randomInt(1, 8);
            let total = 0;
            const items = [];
            const itemNames = new Set();
            let salePromos = [];
            let discountTotal = 0;

            for (let k = 0; k < numItems; k++) {
                const prod = randomElement(allProducts);
                let qty, subtotal;

                if (prod.type === 'WEIGHT') {
                    const grams = randomInt(100, 2500);
                    qty = grams / 1000;
                    subtotal = prod.price * qty;
                } else {
                    qty = randomInt(1, 4);
                    subtotal = prod.price * qty;
                }

                total += subtotal;
                items.push({
                    product_id: prod.id,
                    product_name: prod.name,
                    unit_price: prod.price,
                    quantity: qty,
                    subtotal: subtotal
                });
                itemNames.add(prod.name);
            }

            // Aplicar Promociones Si Corresponde
            // Check si la venta contiene TODOS los productos requeridos por una promo
            activePromos.forEach(promo => {
                const matchesAll = promo.matches.every(m => itemNames.has(m));
                if (matchesAll && Math.random() > 0.5) { // 50% chance si cumple requisitos
                    salePromos.push({
                        promotion_id: promo.id,
                        promotion_name: promo.name,
                        discount_amount: promo.discount
                    });
                    discountTotal += promo.discount;
                }
            });

            if (discountTotal > total) discountTotal = total - 1;

            batchSales.push({
                total,
                discountTotal,
                finalTotal: total - discountTotal,
                paymentMethodId: Math.random() > 0.4 ? 1 : 2,
                createdAt: formatLocalDate(saleTime),
                items,
                promotions: salePromos
            });

            processedSales++;

            if (batchSales.length >= BATCH_SIZE) {
                flushBatch(batchSales);
                batchSales.length = 0;
                process.stdout.write(`\r   Progreso: ${(processedSales / TOTAL_TARGET_SALES * 100).toFixed(1)}% `);
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    if (batchSales.length > 0) {
        flushBatch(batchSales);
    }

    console.log(`\n✅ Seed Finalizado! Total: ${processedSales.toLocaleString()} ventas.`);
    db.close();
}

seed().catch(err => {
    console.error('\n❌ Error:', err);
    process.exit(1);
});
