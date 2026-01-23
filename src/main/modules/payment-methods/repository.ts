import type { Database } from 'better-sqlite3'
import type { PaymentMethod } from '@types'

export function createPaymentMethodRepository(db: Database) {
  return {
    create(name: string): PaymentMethod {
      const now = new Date().toISOString()

      const result = db
        .prepare(
          `INSERT INTO payment_methods (name, is_active, created_at)
         VALUES (?, 1, ?)`
        )
        .run(name, now)

      return {
        id: Number(result.lastInsertRowid),
        name,
        isActive: true,
        createdAt: now
      }
    },

    findAll(): PaymentMethod[] {
      const rows = db
        .prepare(
          `SELECT
           id,
           name,
           is_active as isActive,
           created_at as createdAt
         FROM payment_methods
         ORDER BY name`
        )
        .all()

      return rows as PaymentMethod[]
    },

    findById(id: number): PaymentMethod | null {
      const row = db
        .prepare(
          `SELECT
           id,
           name,
           is_active as isActive,
           created_at as createdAt
         FROM payment_methods
         WHERE id = ?`
        )
        .get(id)

      return row ? (row as PaymentMethod) : null
    },

    update(id: number, name: string): void {
      db.prepare(
        `UPDATE payment_methods
         SET name = ?
         WHERE id = ?`
      ).run(name, id)
    },

    toggle(id: number, isActive: boolean): void {
      db.prepare(
        `UPDATE payment_methods
         SET is_active = ?
         WHERE id = ?`
      ).run(isActive ? 1 : 0, id)
    }
  }
}
