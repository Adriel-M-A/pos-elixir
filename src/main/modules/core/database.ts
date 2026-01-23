import BetterSqlite3 from 'better-sqlite3'
import type { Database } from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { mkdirSync } from 'fs'

let db: Database | null = null

export function initDB(): Database {
  if (db) return db

  let dbPath = ''
  if (app.isPackaged) {
    dbPath = join(app.getPath('userData'), 'database.db')
  } else {
    // En desarrollo: usar carpeta data/ en la raíz del proyecto
    const projectRoot = app.getAppPath()
    const dataDir = join(projectRoot, 'data')
    mkdirSync(dataDir, { recursive: true })
    dbPath = join(dataDir, 'database.db')
  }

  db = new BetterSqlite3(dbPath, {
    verbose: undefined
  })

  return db
}

export function getDB(): Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}
