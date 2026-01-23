import type { Database } from 'better-sqlite3'
import { createFlavorRepository } from './repository'
import { createFlavorService } from './service'
import { registerFlavorHandlers } from './handlers'

export function initFlavorModule(db: Database) {
    const repository = createFlavorRepository(db)
    const service = createFlavorService(repository)
    registerFlavorHandlers(service)
}
