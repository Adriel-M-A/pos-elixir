import type { Database } from 'better-sqlite3'
import type { Category } from '@types'

export function createCategoryRepository(db: Database) {
  return {
    create(name: string): Category {
      const now = new Date().toISOString()
      const result = db
        .prepare(
          `INSERT INTO categories (name, is_active, created_at)
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

    findAll(): Category[] {
      const rows = db
        .prepare(
          `SELECT id, name, is_active as isActive, created_at as createdAt
           FROM categories
           ORDER BY name`
        )
        .all()

      return rows as Category[]
    },

    findById(id: number): Category | null {
      const row = db
        .prepare(
          `SELECT id, name, is_active as isActive, created_at as createdAt
           FROM categories
           WHERE id = ?`
        )
        .get(id)

      return row ? (row as Category) : null
    },

    update(id: number, name: string): void {
      db.prepare(
        `UPDATE categories
         SET name = ?
         WHERE id = ?`
      ).run(name, id)
    },

    toggle(id: number, isActive: boolean): void {
      db.prepare(
        `UPDATE categories
         SET is_active = ?
         WHERE id = ?`
      ).run(isActive ? 1 : 0, id)
    },

    countProductsInCategory(categoryId: number): number {
      const result = db
        .prepare<[number], { count: number }>(
          `SELECT COUNT(*) as count
           FROM products
           WHERE category_id = ?`
        )
        .get(categoryId) as { count: number } | undefined

      return result ? result.count : 0
    },

    delete(id: number): void {
      db.prepare(
        `DELETE FROM categories
         WHERE id = ?`
      ).run(id)
    },

    setProductsCategoryToNull(categoryId: number): void {
      db.prepare(
        `UPDATE products
         SET category_id = NULL
         WHERE category_id = ?`
      ).run(categoryId)
    }
  }
}
