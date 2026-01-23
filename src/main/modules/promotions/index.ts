import type { Database } from 'better-sqlite3'

import { createPromotionRepository } from './repository'
import { createPromotionService } from './service'
import { registerPromotionHandlers } from './handlers'

export function initPromotionModule(db: Database) {

  const repository = createPromotionRepository(db)
  const service = createPromotionService(repository)
  registerPromotionHandlers(service)
}
