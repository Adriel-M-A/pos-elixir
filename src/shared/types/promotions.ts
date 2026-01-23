export type PromotionDiscountType = 'PERCENTAGE' | 'FIXED'

export interface Promotion {
  id: number
  name: string
  discountType: PromotionDiscountType
  discountValue: number
  isActive: boolean
  createdAt: string
  products?: PromotionProduct[]
}

export interface PromotionProduct {
  id: number
  promotionId: number
  productId: number
  requiredQty: number
}
