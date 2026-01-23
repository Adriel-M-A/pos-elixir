import type { Promotion } from '@types'
import { createPromotionSchema, updatePromotionSchema, togglePromotionSchema } from './validations'

export function createPromotionService(repository: any) {
  return {
    create(data: unknown): Promotion {
      const parsed = createPromotionSchema.parse(data)
      const promotion = repository.create(parsed)
      return {
        ...promotion,
        products: repository.findProducts(promotion.id)
      }
    },

    list(): Promotion[] {
      return repository.findAll().map((promotion: Promotion) => ({
        ...promotion,
        products: repository.findProducts(promotion.id)
      }))
    },

    get(id: number) {
      const promotion = repository.findById(id)
      if (!promotion) throw new Error('Promotion not found')
      const products = repository.findProducts(id)
      return { ...promotion, products }
    },

    update(id: number, data: unknown): void {
      const parsed = updatePromotionSchema.parse(data)
      const promotion = repository.findById(id)
      if (!promotion) throw new Error('Promotion not found')
      repository.update(id, parsed)
    },

    toggle(id: number, data: unknown): void {
      const parsed = togglePromotionSchema.parse(data)
      const promotion = repository.findById(id)
      if (!promotion) throw new Error('Promotion not found')
      repository.toggle(id, parsed.isActive)
    },

    delete(id: number): void {
      const promotion = repository.findById(id)
      if (!promotion) throw new Error('Promotion not found')
      repository.delete(id)
    }
  }
}
