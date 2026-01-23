import type { Database } from 'better-sqlite3'

import { createPaymentMethodRepository } from './repository'
import { createPaymentMethodService } from './service'
import { registerPaymentMethodHandlers } from './handlers'

export function initPaymentMethodModule(db: Database) {


  const repository = createPaymentMethodRepository(db)
  const service = createPaymentMethodService(repository)
  registerPaymentMethodHandlers(service)
}
