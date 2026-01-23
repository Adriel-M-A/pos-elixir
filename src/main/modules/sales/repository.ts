import type { Database } from 'better-sqlite3'
import type { Sale, SaleItem, SalePromotion } from '@types'

export function createSaleRepository(db: Database) {
  return {
    create(data: {
      paymentMethodId: number
      total: number
      discountTotal: number
      finalTotal: number
      items: {
        productId: number
        productName: string
        unitPrice: number
        quantity: number
        subtotal: number
      }[]
      promotions: {
        promotionId: number
        promotionName: string
        discountAmount: number
      }[]
      userId?: number
      source?: 'LOCAL' | 'ONLINE'
    }): Sale {
      const now = new Date().toLocaleString('sv-SE').replace(' ', 'T')

      const createTransaction = db.transaction(() => {
        // Obtenemos el nombre del usuario si existe
        let createdByName: string | null = null
        if (data.userId) {
          const user = db.prepare('SELECT name FROM users WHERE id = ?').get(data.userId) as { name: string } | undefined
          if (user) createdByName = user.name
        }

        const saleResult = db
          .prepare(
            `INSERT INTO sales (total, discount_total, final_total, payment_method_id, status, created_at, created_by, created_by_name, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(data.total, data.discountTotal, data.finalTotal, data.paymentMethodId, 'active', now, data.userId || null, createdByName, data.source || 'LOCAL')

        const saleId = Number(saleResult.lastInsertRowid)

        // Guardar items y descontar stock
        const itemStmt = db.prepare(
          `INSERT INTO sale_items (sale_id, product_id, product_name, unit_price, quantity, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`
        )

        const updateStockStmt = db.prepare(
          `UPDATE products 
           SET stock = stock - ? 
           WHERE id = ? AND is_stock_controlled = 1 AND stock >= ?`
        )

        const checkStockControlStmt = db.prepare(
          `SELECT is_stock_controlled as isStockControlled FROM products WHERE id = ?`
        )

        for (const item of data.items) {
          // 1. Guardar item de venta
          itemStmt.run(
            saleId,
            item.productId,
            item.productName,
            item.unitPrice,
            item.quantity,
            item.subtotal
          )

          // 2. Verificar si el producto tiene control de stock
          const productCheck = checkStockControlStmt.get(item.productId) as { isStockControlled: number }

          if (productCheck && productCheck.isStockControlled === 1) {
            // 3. Intentar descontar stock
            const result = updateStockStmt.run(item.quantity, item.productId, item.quantity)

            if (result.changes === 0) {
              // Si no se actualizó ninguna fila, significa que no había suficiente stock
              throw new Error(`Stock insuficiente para el producto: ${item.productName}`)
            }
          }
        }

        // Guardar promociones
        const promoStmt = db.prepare(
          `INSERT INTO sale_promotions (sale_id, promotion_id, promotion_name, discount_amount)
           VALUES (?, ?, ?, ?)`
        )
        for (const promo of data.promotions) {
          promoStmt.run(saleId, promo.promotionId, promo.promotionName, promo.discountAmount)
        }

        return saleId
      })

      const saleId = createTransaction()

      return {
        id: saleId,
        total: data.total,
        discountTotal: data.discountTotal,
        finalTotal: data.finalTotal,
        paymentMethodId: data.paymentMethodId,
        source: data.source || 'LOCAL',
        createdAt: now
      }
    },

    cancel(id: number): boolean {
      const cancelTransaction = db.transaction(() => {
        // 1. Verificar estado actual
        const currentSale = db
          .prepare('SELECT status FROM sales WHERE id = ?')
          .get(id) as { status: string } | undefined

        if (!currentSale || currentSale.status === 'cancelled') {
          return false
        }

        // 2. Obtener items para devolver stock
        const items = db
          .prepare('SELECT product_id, quantity FROM sale_items WHERE sale_id = ?')
          .all(id) as { product_id: number; quantity: number }[]

        // 3. Preparar statement para devolver stock
        // Solo actualiza si is_stock_controlled es 1 (true)
        const returnStockStmt = db.prepare(`
          UPDATE products 
          SET stock = stock + ? 
          WHERE id = ? AND is_stock_controlled = 1
        `)

        for (const item of items) {
          returnStockStmt.run(item.quantity, item.product_id)
        }

        // 4. Marcar venta como cancelada
        const result = db.prepare("UPDATE sales SET status = 'cancelled' WHERE id = ?").run(id)

        return result.changes > 0
      })

      return cancelTransaction()
    },

    findAllWithItems(
      startDate?: string,
      endDate?: string
    ): (Sale & { items: (SaleItem & { productType?: string })[]; promotions: SalePromotion[] })[] {
      let query = `
        SELECT 
          s.id,
          s.total,
          s.discount_total as discountTotal,
          s.final_total as finalTotal,
          s.payment_method_id as paymentMethodId,
          s.status,
          s.created_at as createdAt,
          pm.name as paymentMethodName,
          s.created_by_name as createdBy,
          s.source
        FROM sales s
        LEFT JOIN payment_methods pm ON s.payment_method_id = pm.id
        WHERE s.status != 'cancelled'
      `

      const params: any[] = []

      if (startDate && endDate) {
        // Convertir YYYY-MM-DD a YYYY-MM-DD 00:00:00 y YYYY-MM-DD 23:59:59
        // También manejar el formato T que se usa en la BD
        const startDateTime = `${startDate}T00:00:00`
        const endDateTime = `${endDate}T23:59:59`

        query += ` AND s.created_at BETWEEN ? AND ?`
        params.push(startDateTime, endDateTime)
      }

      query += ` ORDER BY s.created_at DESC`

      const sales = db.prepare(query).all(...params) as any[]

      if (sales.length === 0) return []

      const saleIds = sales.map((s) => s.id)
      const placeholders = saleIds.map(() => '?').join(',')

      const items = db
        .prepare(
          `
        SELECT 
          si.id,
          si.sale_id as saleId,
          si.product_id as productId,
          si.product_name as productName,
          si.unit_price as unitPrice,
          si.quantity,
          si.subtotal,
          p.product_type as productType
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id IN (${placeholders})
        ORDER BY si.id
      `
        )
        .all(...saleIds) as (SaleItem & { productType?: string })[]

      const promotions = db
        .prepare(
          `
        SELECT 
          id,
          sale_id as saleId,
          promotion_id as promotionId,
          promotion_name as promotionName,
          discount_amount as discountAmount
        FROM sale_promotions 
        WHERE sale_id IN (${placeholders})
        ORDER BY id
      `
        )
        .all(...saleIds) as SalePromotion[]

      // Group items and promotions by saleId for O(1) lookup
      const itemsMap = new Map<number, (SaleItem & { productType?: string })[]>()
      items.forEach((item) => {
        if (!itemsMap.has(item.saleId)) itemsMap.set(item.saleId, [])
        itemsMap.get(item.saleId)!.push(item)
      })

      const promotionsMap = new Map<number, SalePromotion[]>()
      promotions.forEach((p) => {
        if (!promotionsMap.has(p.saleId)) promotionsMap.set(p.saleId, [])
        promotionsMap.get(p.saleId)!.push(p)
      })

      return sales.map((sale) => ({
        ...sale,
        items: itemsMap.get(sale.id) || [],
        promotions: promotionsMap.get(sale.id) || []
      }))
    }
  }
}
