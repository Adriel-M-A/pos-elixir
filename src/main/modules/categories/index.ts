import type { Database } from 'better-sqlite3'

import { createCategoryRepository } from './repository'
import { createCategoryService } from './service'
import { registerCategoryHandlers } from './handlers'

export function initCategoryModule(db: Database) {

  const repository = createCategoryRepository(db)
  const service = createCategoryService(repository)
  registerCategoryHandlers(service)
}
