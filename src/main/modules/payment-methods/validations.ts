import { z } from 'zod'

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1)
})

export const updatePaymentMethodSchema = z.object({
  name: z.string().min(1)
})

export const togglePaymentMethodSchema = z.object({
  isActive: z.boolean()
})
