import type { Database } from 'better-sqlite3'

import { initCategoryModule } from '../categories'
import { initProductModule } from '../products'
import { initPaymentMethodModule } from '../payment-methods'
import { initPromotionModule } from '../promotions'
import { initSaleModule } from '../sales'
// import { initReportModule } from '../reports' // Asegurar import correcto si no estaba
import { initReportModule } from '../reports'
import { initBackupModule } from '../backups'
import { initAuthModule } from '../auth'
import { initUserModule } from '../users'
import { initFlavorModule } from '../flavors'

export function initModules(db: Database) {
  initAuthModule(db)
  initUserModule(db)
  initCategoryModule(db)
  initProductModule(db)
  initPaymentMethodModule(db)
  initPromotionModule(db)
  initSaleModule(db)
  initReportModule(db)
  initBackupModule(db)
  initFlavorModule(db)
}
