import type { Database } from 'better-sqlite3'
import type { DailySaleRow, SalesSummary, PaymentMethodSummary, Product } from '@types'

export function createReportRepository(db: Database) {
  return {
    // ========================
    // REPORTES DE VENTAS
    // ========================

    getSalesByDateRange(start: string, end: string): DailySaleRow[] {
      // Optimizacion: Usar comparación de strings ISO
      const startDateTime = `${start}T00:00:00`
      const endDateTime = `${end}T23:59:59`

      return db
        .prepare(
          `SELECT
            s.id,
            s.created_at as createdAt,
            s.payment_method_id as paymentMethodId,
            pm.name as paymentMethodName,
            s.total,
            s.discount_total as discountTotal,
            s.final_total as finalTotal
          FROM sales s
          JOIN payment_methods pm ON s.payment_method_id = pm.id
          WHERE s.status != 'cancelled' 
            AND s.created_at BETWEEN ? AND ?
          ORDER BY s.created_at ASC`
        )
        .all(startDateTime, endDateTime) as DailySaleRow[]
    },

    getSalesSummary(start: string, end: string): SalesSummary {
      const startDateTime = `${start}T00:00:00`
      const endDateTime = `${end}T23:59:59`

      const summary = db
        .prepare(
          `SELECT
            COUNT(*) as totalSales,
            COALESCE(SUM(total), 0) as totalAmount,
            COALESCE(SUM(discount_total), 0) as totalDiscount,
            COALESCE(SUM(final_total), 0) as totalFinal
          FROM sales
          WHERE status != 'cancelled' 
            AND created_at BETWEEN ? AND ?`
        )
        .get(startDateTime, endDateTime) as SalesSummary | undefined

      return (
        summary ?? {
          totalSales: 0,
          totalAmount: 0,
          totalDiscount: 0,
          totalFinal: 0
        }
      )
    },

    getPaymentMethodSummary(
      start: string,
      end: string
    ): (PaymentMethodSummary & { name: string })[] {
      const startDateTime = `${start}T00:00:00`
      const endDateTime = `${end}T23:59:59`

      return db
        .prepare(
          `SELECT
            s.payment_method_id as paymentMethodId,
            pm.name as name,
            COALESCE(SUM(s.final_total), 0) as totalFinal
          FROM sales s
          JOIN payment_methods pm ON s.payment_method_id = pm.id
          WHERE s.status != 'cancelled' 
            AND s.created_at BETWEEN ? AND ?
          GROUP BY s.payment_method_id`
        )
        .all(startDateTime, endDateTime) as (PaymentMethodSummary & { name: string })[]
    },

    getSalesSourceSummary(
      start: string,
      end: string
    ): SalesSourceSummary[] {
      const startDateTime = `${start}T00:00:00`
      const endDateTime = `${end}T23:59:59`

      return db
        .prepare(
          `SELECT
            source,
            COALESCE(SUM(final_total), 0) as totalFinal
          FROM sales
          WHERE status != 'cancelled' 
            AND created_at BETWEEN ? AND ?
          GROUP BY source`
        )
        .all(startDateTime, endDateTime) as SalesSourceSummary[]
    },

    getSaleDetail(saleId: number) {
      const sale = db
        .prepare(
          `SELECT
            id,
            created_at as createdAt,
            payment_method_id as paymentMethodId,
            total,
            discount_total as discountTotal,
            final_total as finalTotal
          FROM sales
          WHERE id = ?`
        )
        .get(saleId)

      const items = db
        .prepare(
          `SELECT
            product_id as productId,
            product_name as productName,
            unit_price as unitPrice,
            quantity,
            subtotal
          FROM sale_items
          WHERE sale_id = ?`
        )
        .all(saleId)

      const promotions = db
        .prepare(
          `SELECT
            promotion_id as promotionId,
            promotion_name as promotionName,
            discount_amount as discountAmount
          FROM sale_promotions
          WHERE sale_id = ?`
        )
        .all(saleId)

      return { sale, items, promotions }
    },

    // ========================
    // PRODUCTOS MÁS VENDIDOS
    // ========================

    // Para POS: ranking histórico
    getTopProducts(): (Product & { totalQuantity: number })[] {
      return db
        .prepare(
          `SELECT 
        p.id, 
        p.name, 
        p.category_id as categoryId, 
        p.price, 
        p.stock, 
        p.is_active as isActive, 
        p.created_at as createdAt,
        COALESCE(SUM(si.quantity), 0) as totalQuantity,
        p.product_type as productType
      FROM products p
      LEFT JOIN sale_items si ON si.product_id = p.id
      GROUP BY p.id
      ORDER BY totalQuantity DESC, p.name ASC`
        )
        .all() as (Product & { totalQuantity: number; productType?: string })[]
    },

    // Para reportes: ranking por rango de fechas
    getTopProductsByDateRange(
      start: string,
      end: string
    ): {
      productId: number
      productName: string
      totalQuantity: number
      totalRevenue: number
      price: number
    }[] {
      const startDateTime = `${start}T00:00:00`
      const endDateTime = `${end}T23:59:59`

      return db
        .prepare(
          `SELECT
            si.product_id as productId,
            COALESCE(p.name, MAX(si.product_name)) as productName,
            SUM(si.quantity) as totalQuantity,
            SUM(si.subtotal) as totalRevenue,
            COALESCE(p.price, MAX(si.unit_price)) as price,
            p.product_type as productType
          FROM sale_items si
          JOIN sales s ON s.id = si.sale_id
          LEFT JOIN products p ON p.id = si.product_id
          WHERE s.status != 'cancelled' 
            AND s.created_at BETWEEN ? AND ?
          GROUP BY si.product_id
          ORDER BY totalRevenue DESC, productName ASC`
        )
        .all(startDateTime, endDateTime) as {
          productId: number
          productName: string
          totalQuantity: number
          totalRevenue: number
          price: number
          productType?: string
        }[]
    },

    getLowStockProducts(limit = 10): {
      id: number
      name: string
      stock: number
      minStock: number
      price: number
    }[] {
      return db
        .prepare(
          `SELECT
            id,
            name,
            stock,
            min_stock as minStock,
            price
          FROM products
          WHERE is_stock_controlled = 1 AND is_active = 1 AND stock <= (min_stock + 5)
          ORDER BY (stock - min_stock) ASC, stock ASC
          LIMIT ?`
        )
        .all(limit) as {
          id: number
          name: string
          stock: number
          minStock: number
          price: number
        }[]
    }
  }
}
