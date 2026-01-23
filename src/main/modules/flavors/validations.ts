import { z } from 'zod'

export const createFlavorSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    stock: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true)
})

export const updateFlavorSchema = z.object({
    name: z.string().min(1).optional(),
    stock: z.number().int().min(0).optional(),
    isActive: z.boolean().optional()
})

export const updateStockSchema = z.object({
    stock: z.number().int().min(0)
})
