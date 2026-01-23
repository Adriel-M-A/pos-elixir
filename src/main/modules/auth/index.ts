import type { Database } from 'better-sqlite3'
import { createAuthRepository } from './repository'
import { createAuthService } from './service'
import { registerAuthHandlers } from './handlers'

export function initAuthModule(db: Database) {
    const repository = createAuthRepository(db)
    const service = createAuthService(repository)
    registerAuthHandlers(service)
}
