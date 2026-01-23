import type { Sale } from '@types'
import { createSaleSchema } from './validations'

export function createSaleService(repository: any, promotionRepository: any) {
  return {
    create(data: unknown): Sale {
      const parsed = createSaleSchema.parse(data)

      let total = 0
      for (const item of parsed.items) {
        total += item.unitPrice * item.quantity
      }

      let discountTotal = 0
      const promotions = parsed.promotions ?? []
      for (const promo of promotions) {
        // Validation: Check if promotion exists and is active
        const existingPromo = promotionRepository.findById(promo.promotionId)
        if (!existingPromo) {
          throw new Error(`Promoción inválida: ID ${promo.promotionId} no encontrado`)
        }
        if (!existingPromo.isActive) {
          throw new Error(`Promoción "${existingPromo.name}" ya no está activa`)
        }

        discountTotal += promo.discountAmount
      }

      const finalTotal = total - discountTotal

      return repository.create({
        paymentMethodId: parsed.paymentMethodId,
        total,
        discountTotal,
        finalTotal,
        items: parsed.items.map((i) => ({
          ...i,
          subtotal: i.unitPrice * i.quantity
        })),
        promotions,
        userId: parsed.userId
      })
    },

    findAllWithItems(startDate?: string, endDate?: string) {
      return repository.findAllWithItems(startDate, endDate)
    },

    cancel(id: number): boolean {
      return repository.cancel(id)
    }
  }
}
