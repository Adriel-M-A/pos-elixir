const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../data/database.db');
const db = new Database(DB_PATH);

console.log('--- Corrigiendo Estado de Migraciones ---');

try {
  // Verificar si la tabla existe
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'").get();
  
  if (tableExists) {
      console.log("Marcando '009_add_sale_source.sql' como completada...");
      db.prepare("INSERT OR IGNORE INTO _migrations (name) VALUES ('009_add_sale_source.sql')").run();
      console.log("¡Corrección aplicada con éxito!");
  } else {
      console.error("Error: La tabla _migrations no existe. Asegúrate de que la app haya intentado iniciar al menos una vez.");
  }
} catch (error) {
  console.error("Error aplicando corrección:", error);
} finally {
  db.close();
}
