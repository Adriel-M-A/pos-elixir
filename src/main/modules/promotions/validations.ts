import { z } from 'zod'

export const promotionProductSchema = z.object({
  productId: z.number().int().positive(),
  requiredQty: z.number().positive()
})

export const createPromotionSchema = z.object({
  name: z.string().min(1),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  products: z.array(promotionProductSchema).min(1)
})

export const updatePromotionSchema = z.object({
  name: z.string().min(1),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  products: z.array(promotionProductSchema).min(1)
})

export const togglePromotionSchema = z.object({
  isActive: z.boolean()
})
