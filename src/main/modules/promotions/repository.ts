import type { Database } from 'better-sqlite3'
import type { Promotion, PromotionProduct } from '@types'

export function createPromotionRepository(db: Database) {
  return {
    create(data: {
      name: string
      discountType: string
      discountValue: number
      products: { productId: number; requiredQty: number }[]
    }): Promotion {
      const now = new Date().toISOString()

      const result = db
        .prepare(
          `INSERT INTO promotions (name, discount_type, discount_value, is_active, created_at)
         VALUES (?, ?, ?, 1, ?)`
        )
        .run(data.name, data.discountType, data.discountValue, now)

      const promotionId = Number(result.lastInsertRowid)

      const stmt = db.prepare(
        `INSERT INTO promotion_products (promotion_id, product_id, required_qty)
         VALUES (?, ?, ?)`
      )

      for (const p of data.products) {
        stmt.run(promotionId, p.productId, p.requiredQty)
      }

      return {
        id: promotionId,
        name: data.name,
        discountType: data.discountType as any,
        discountValue: data.discountValue,
        isActive: true,
        createdAt: now
      }
    },

    findAll(): Promotion[] {
      const rows = db
        .prepare(
          `SELECT
           id,
           name,
           discount_type as discountType,
           discount_value as discountValue,
           is_active as isActive,
           created_at as createdAt
         FROM promotions
         ORDER BY name`
        )
        .all()

      return rows as Promotion[]
    },

    findProducts(promotionId: number): PromotionProduct[] {
      const rows = db
        .prepare(
          `SELECT
           id,
           promotion_id as promotionId,
           product_id as productId,
           required_qty as requiredQty
         FROM promotion_products
         WHERE promotion_id = ?`
        )
        .all(promotionId)

      return rows as PromotionProduct[]
    },

    findById(id: number): Promotion | null {
      const row = db
        .prepare(
          `SELECT
           id,
           name,
           discount_type as discountType,
           discount_value as discountValue,
           is_active as isActive,
           created_at as createdAt
         FROM promotions
         WHERE id = ?`
        )
        .get(id)

      return row ? (row as Promotion) : null
    },

    update(
      id: number,
      data: {
        name: string
        discountType: string
        discountValue: number
        products: { productId: number; requiredQty: number }[]
      }
    ): void {
      db.prepare(
        `UPDATE promotions
         SET name = ?, discount_type = ?, discount_value = ?
         WHERE id = ?`
      ).run(data.name, data.discountType, data.discountValue, id)

      db.prepare(`DELETE FROM promotion_products WHERE promotion_id = ?`).run(id)

      const stmt = db.prepare(
        `INSERT INTO promotion_products (promotion_id, product_id, required_qty)
         VALUES (?, ?, ?)`
      )

      for (const p of data.products) {
        stmt.run(id, p.productId, p.requiredQty)
      }
    },

    toggle(id: number, isActive: boolean): void {
      db.prepare(
        `UPDATE promotions
         SET is_active = ?
         WHERE id = ?`
      ).run(isActive ? 1 : 0, id)
    },

    delete(id: number): void {
      // First delete the promotion products to maintain referential integrity
      db.prepare('DELETE FROM promotion_products WHERE promotion_id = ?').run(id)
      // Then delete the promotion
      const result = db.prepare('DELETE FROM promotions WHERE id = ?').run(id)

      if (result.changes === 0) {
        throw new Error('Promotion not found')
      }
    }
  }
}
