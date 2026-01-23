export interface Sale {
  id: number
  total: number
  discountTotal: number
  finalTotal: number
  paymentMethodId: number
  createdAt: string
  paymentMethodName?: string
  createdBy?: string // Username of the creator
  source?: 'LOCAL' | 'ONLINE'
}

export interface SaleWithDetails extends Sale {
  items: SaleItem[]
  promotions: SalePromotion[]
}

export interface SaleItem {
  id: number
  saleId: number
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
  productType?: 'UNIT' | 'WEIGHT'
}

export interface SalePromotion {
  id: number
  saleId: number
  promotionId: number
  promotionName: string
  discountAmount: number
}
