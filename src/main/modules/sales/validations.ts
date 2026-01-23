import { z } from 'zod'

export const saleItemSchema = z.object({
  productId: z.number().int().positive(),
  productName: z.string().min(1),
  unitPrice: z.number().positive(),
  quantity: z.number().positive()
})

export const salePromotionSchema = z.object({
  promotionId: z.number().int().positive(),
  promotionName: z.string().min(1),
  discountAmount: z.number().positive()
})

export const createSaleSchema = z.object({
  paymentMethodId: z.number().int().positive(),
  items: z.array(saleItemSchema).min(1),
  promotions: z.array(salePromotionSchema).optional(),
  userId: z.number().int().positive().optional()
})
