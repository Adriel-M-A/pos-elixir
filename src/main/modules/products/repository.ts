import type { Database } from 'better-sqlite3'
import type { Product } from '@types'

export function createProductRepository(db: Database) {
  return {
    create(data: {
      name: string
      categoryId: number | null
      price: number
      stock: number
      isStockControlled: boolean
      minStock: number
      productType: 'UNIT' | 'WEIGHT'
    }): Product {
      const now = new Date().toISOString()

      const result = db
        .prepare(
          `INSERT INTO products (name, category_id, price, stock, is_stock_controlled, min_stock, is_active, created_at, product_type)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
        )
        .run(
          data.name,
          data.categoryId,
          data.price,
          data.stock,
          data.isStockControlled ? 1 : 0,
          data.minStock,
          now,
          data.productType
        )

      return {
        id: Number(result.lastInsertRowid),
        name: data.name,
        categoryId: data.categoryId,
        price: data.price,
        stock: data.stock,
        isStockControlled: data.isStockControlled,
        minStock: data.minStock,
        isActive: true,
        createdAt: now,
        productType: data.productType
      }
    },

    findAll(): Product[] {
      const rows = db
        .prepare(
          `SELECT
            id,
            name,
            category_id as categoryId,
            price,
            stock,
            is_stock_controlled as isStockControlled,
            min_stock as minStock,
            is_active as isActive,
            created_at as createdAt,
            product_type as productType
          FROM products
          ORDER BY name`
        )
        .all()

      return rows.map((row: any) => ({
        ...row,
        isStockControlled: Boolean(row.isStockControlled),
        isActive: Boolean(row.isActive)
      })) as Product[]
    },

    findById(id: number): Product | null {
      const row = db
        .prepare(
          `SELECT
            id,
            name,
            category_id as categoryId,
            price,
            stock,
            is_stock_controlled as isStockControlled,
            min_stock as minStock,
            is_active as isActive,
            created_at as createdAt
          FROM products
          WHERE id = ?`
        )
        .get(id) as any

      return row
        ? ({
          ...row,
          isStockControlled: Boolean(row.isStockControlled),
          isActive: Boolean(row.isActive)
        } as Product)
        : null
    },

    update(
      id: number,
      data: {
        name?: string
        categoryId?: number | null
        price?: number
        stock?: number
        isStockControlled?: boolean
        minStock?: number
        productType?: 'UNIT' | 'WEIGHT'
      }
    ): void {
      const fields: string[] = []
      const values: any[] = []

      // Lógica de Negocio: Si se desactiva el control de stock, resetear valores
      if (data.isStockControlled === false) {
        data.stock = 0
        data.minStock = 0
      }

      if (data.name !== undefined) {
        fields.push('name = ?')
        values.push(data.name)
      }
      if (data.categoryId !== undefined) {
        fields.push('category_id = ?')
        values.push(data.categoryId)
      }
      if (data.price !== undefined) {
        fields.push('price = ?')
        values.push(data.price)
      }
      if (data.stock !== undefined) {
        fields.push('stock = ?')
        values.push(data.stock)
      }
      if (data.isStockControlled !== undefined) {
        fields.push('is_stock_controlled = ?')
        values.push(data.isStockControlled ? 1 : 0)
      }
      if (data.minStock !== undefined) {
        fields.push('min_stock = ?')
        values.push(data.minStock)
      }
      if (data.productType !== undefined) {
        fields.push('product_type = ?')
        values.push(data.productType)
      }

      if (fields.length === 0) return

      values.push(id)

      db.prepare(
        `UPDATE products
         SET ${fields.join(', ')}
         WHERE id = ?`
      ).run(...values)
    },

    toggle(id: number, isActive: boolean): void {
      db.prepare(
        `UPDATE products
         SET is_active = ?
         WHERE id = ?`
      ).run(isActive ? 1 : 0, id)
    },

    delete(id: number): void {
      const deleteTransaction = db.transaction(() => {
        // 1. Obtener promociones afectadas
        const promotions = db
          .prepare(
            `SELECT DISTINCT promotion_id 
             FROM promotion_products 
             WHERE product_id = ?`
          )
          .all(id) as { promotion_id: number }[]

        const promotionIds = promotions.map((p) => p.promotion_id)

        if (promotionIds.length > 0) {
          // 2. Eliminar items de esas promociones (toda la promoción muere)
          const placeholders = promotionIds.map(() => '?').join(',')
          db.prepare(
            `DELETE FROM promotion_products 
             WHERE promotion_id IN (${placeholders})`
          ).run(...promotionIds)

          // 3. Eliminar las promociones
          db.prepare(
            `DELETE FROM promotions 
             WHERE id IN (${placeholders})`
          ).run(...promotionIds)
        }

        // 4. Eliminar el producto
        db.prepare('DELETE FROM products WHERE id = ?').run(id)
      })

      deleteTransaction()
    },

    findPromotionsByProductId(id: number): string[] {
      const rows = db
        .prepare(
          `SELECT p.name
           FROM promotions p
           JOIN promotion_products pp ON p.id = pp.promotion_id
           WHERE pp.product_id = ?`
        )
        .all(id) as { name: string }[]

      return rows.map((r) => r.name)
    }
  }
}
