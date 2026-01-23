import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1),
  categoryId: z.number().int().positive().nullable().optional(),
  price: z.number().positive(),
  priceDelivery: z.number().min(0).nullable().optional(),
  stock: z.number().int().min(0).default(0),
  isStockControlled: z.boolean().default(false),
  minStock: z.number().int().min(0).default(0),
  productType: z.enum(['UNIT', 'WEIGHT']).default('UNIT')
}).refine((data) => {
  if (data.productType === 'WEIGHT' && data.isStockControlled) {
    return false
  }
  return true
}, {
  message: "Products sold by weight cannot have stock control enabled",
  path: ["isStockControlled"]
})

export const updateProductSchema = z.object({
  name: z.string().min(1),
  categoryId: z.number().int().positive().nullable().optional(),
  price: z.number().positive(),
  priceDelivery: z.number().min(0).nullable().optional(),
  stock: z.number().int().min(0).optional(),
  isStockControlled: z.boolean().optional(),
  minStock: z.number().int().min(0).optional(),
  productType: z.enum(['UNIT', 'WEIGHT']).optional()
}).refine((data) => {
  if (data.productType === 'WEIGHT' && data.isStockControlled) {
    return false
  }
  return true
}, {
  message: "Products sold by weight cannot have stock control enabled",
  path: ["isStockControlled"]
})

export const toggleProductSchema = z.object({
  isActive: z.boolean()
})
