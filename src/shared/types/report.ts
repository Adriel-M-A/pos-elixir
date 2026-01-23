export interface DailySaleRow {
  id: number
  createdAt: string
  paymentMethodId: number
  paymentMethodName: string
  total: number
  discountTotal: number
  finalTotal: number
}

export interface SalesSummary {
  totalSales: number
  totalAmount: number
  totalDiscount: number
  totalFinal: number
}

export interface PaymentMethodSummary {
  paymentMethodId: number
  totalFinal: number
}

export interface SalesSourceSummary {
  source: string
  totalFinal: number
}

export interface TopProduct {
  productId: number
  productName: string
  totalQuantity: number
  totalRevenue: number
  productType?: 'UNIT' | 'WEIGHT'
}

export type ComparisonPeriod = 'day' | 'week' | 'fortnight' | 'month' | 'custom'

export interface SalesComparison {
  periodType: ComparisonPeriod
  periodLabel: string
  previousRange: {
    start: string
    end: string
  }
  previousValues: {
    totalFinal: number
    totalSales: number
    averageTicket: number
  }
  deltas: {
    totalFinal: number
    totalSales: number
    averageTicket: number
  }
}
