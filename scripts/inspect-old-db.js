const Database = require('better-sqlite3');
const path = require('path');

const OLD_DB_PATH = path.resolve(__dirname, '../../heladeria-ventas-control/heladeria.db');
const db = new Database(OLD_DB_PATH, { readonly: true });

console.log('--- Inspeccionando Base de Datos Antigua ---');

try {
  const salesCount = db.prepare('SELECT COUNT(*) as c FROM sales').get().c;
  console.log(`Total Ventas: ${salesCount}`);

  // Verificar columnas
  const columns = db.pragma('table_info(sales)');
  console.log('Columnas en tabla sales:', columns.map(c => c.name).join(', '));

  // Verificar valores distintos de payment_method
  const payments = db.prepare('SELECT payment_method, COUNT(*) as c FROM sales GROUP BY payment_method').all();
  console.log('\nMétodos de Pago encontrados:');
  console.table(payments);

  // Verificar valores distintos de type
  const types = db.prepare('SELECT type, COUNT(*) as c FROM sales GROUP BY type').all();
  console.log('\nTipos de Venta encontrados:');
  console.table(types);

  // Mostrar muestra de ventas recientes
  const sample = db.prepare('SELECT id, date, type, payment_method, total FROM sales ORDER BY id DESC LIMIT 5').all();
  console.log('\nMuestra de últimas 5 ventas:');
  console.table(sample);

} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}
