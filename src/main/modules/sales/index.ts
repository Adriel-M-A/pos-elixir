import type { Database } from 'better-sqlite3'

import { createSaleRepository } from './repository'
import { createSaleService } from './service'
import { registerSaleHandlers } from './handlers'

import { createPromotionRepository } from '../promotions/repository'

export function initSaleModule(db: Database) {

  const repository = createSaleRepository(db)
  const promotionRepository = createPromotionRepository(db)
  const service = createSaleService(repository, promotionRepository)
  registerSaleHandlers(service)
}
