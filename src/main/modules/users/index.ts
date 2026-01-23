import type { Database } from 'better-sqlite3'
import { createUserRepository } from './repository'
import { createUserService } from './service'
import { registerUserHandlers } from './handlers'

export function initUserModule(db: Database) {
    const repository = createUserRepository(db)
    const service = createUserService(repository)
    registerUserHandlers(service)
}
