import type { Database } from 'better-sqlite3'
import { createBackupService } from './service'
import { registerBackupHandlers } from './handlers'

export function initBackupModule(db: Database) {
    const service = createBackupService(db)
    registerBackupHandlers(service)
}
