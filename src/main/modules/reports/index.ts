import type { Database } from 'better-sqlite3'
import { createReportRepository } from './repository'
import { createReportService } from './service'
import { registerReportHandlers } from './handlers'

export function initReportModule(db: Database) {
  const repository = createReportRepository(db)
  const service = createReportService(repository)
  registerReportHandlers(service)
}
