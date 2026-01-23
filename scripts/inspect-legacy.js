const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const OLD_DB_PATH = path.resolve(__dirname, '../../heladeria-ventas-control/heladeria.db');

if (!fs.existsSync(OLD_DB_PATH)) {
    console.error('ERROR: No se encuentra la base de datos antigua en:', OLD_DB_PATH);
    process.exit(1);
}

const db = new Database(OLD_DB_PATH, { readonly: true });

console.log('--- Inspector de Base de Datos Legacy ---');

// 1. Listar Tablas
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tablas encontradas:', tables.map(t => t.name).join(', '));

// 2. Detalle de columnas por tabla
tables.forEach(table => {
    console.log(`\nTabla: ${table.name}`);
    const columns = db.pragma(`table_info(${table.name})`);
    columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
    });
});

db.close();
