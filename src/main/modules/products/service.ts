import { createProductSchema, updateProductSchema, toggleProductSchema } from './validations'
import type { Product } from '@types'

export function createProductService(repository: any) {
  return {
    create(data: unknown): Product {
      const parsed = createProductSchema.parse(data)
      return repository.create(parsed)
    },

    list(): Product[] {
      return repository.findAll()
    },

    update(id: number, data: unknown): void {
      const parsed = updateProductSchema.parse(data)
      const product = repository.findById(id)
      if (!product) throw new Error('Product not found')
      repository.update(id, parsed)
    },

    toggle(id: number, data: unknown): void {
      const parsed = toggleProductSchema.parse(data)
      const product = repository.findById(id)
      if (!product) throw new Error('Product not found')
      repository.toggle(id, parsed.isActive)
    },

    delete(id: number): void {
      const product = repository.findById(id)
      if (!product) throw new Error('Product not found')
      repository.delete(id)
    },

    findPromotionsByProductId(id: number): string[] {
      return repository.findPromotionsByProductId(id)
    }
  }
}
