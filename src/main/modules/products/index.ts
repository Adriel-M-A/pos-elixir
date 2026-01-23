import type { Database } from 'better-sqlite3'

import { createProductRepository } from './repository'
import { createProductService } from './service'
import { registerProductHandlers } from './handlers'

export function initProductModule(db: Database) {

  const repository = createProductRepository(db)
  const service = createProductService(repository)
  registerProductHandlers(service)
}
