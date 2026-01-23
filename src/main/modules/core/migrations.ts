import { Database } from 'better-sqlite3'
import { join } from 'path'
import { readdirSync, readFileSync } from 'fs'
import { app } from 'electron'

export function runMigrations(db: Database) {
  // Configuración base
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')


  // Determinar la ruta de las migraciones
  // En desarrollo: src/main/migrations
  // En producción se debe asegurar que la carpeta se copie correctamente o usar una ruta relativa adecuada
  const isDev = !app.isPackaged
  let migrationsPath = ''

  if (isDev) {
    migrationsPath = join(app.getAppPath(), 'src', 'main', 'migrations')
  } else {
    // Ajustar según estructura de empaquetado, por ahora asumimos que se copian a resources
    migrationsPath = join(process.resourcesPath, 'migrations')
  }

  // 1. Asegurar tabla de migraciones (Bootstrapping)
  try {
    const bootstrapSql = readFileSync(join(migrationsPath, '000_migrations.sql'), 'utf-8')
    db.exec(bootstrapSql)
  } catch (error) {
    console.error('Error bootstrapping migrations:', error)
    throw error
  }

  // 2. Obtener lista de migraciones aplicadas
  const appliedMigrations = new Set(
    db.prepare('SELECT name FROM _migrations').all().map((row: any) => row.name)
  )

  // 3. Leer y ordenar archivos de migración
  const migrationFiles = readdirSync(migrationsPath)
    .filter((file) => file.endsWith('.sql') && file !== '000_migrations.sql') // Excluir bootstrap si ya se corrió aparte o incluirlo si lógica lo permite
    .sort()


  // 4. Ejecutar nuevas migraciones
  const runMigration = db.transaction((fileName: string, sql: string) => {
    db.exec(sql)
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(fileName)
  })

  let count = 0
  for (const file of migrationFiles) {
    if (!appliedMigrations.has(file)) {
      try {
        const sql = readFileSync(join(migrationsPath, file), 'utf-8')
        runMigration(file, sql)
        count++
      } catch (error) {
        console.error(`Error aplicando migración ${file}:`, error)
        throw error // Detener proceso si falla una migración
      }
    }
  }

  if (count > 0) {
  } else {
  }
}
