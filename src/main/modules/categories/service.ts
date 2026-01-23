import type { Category } from '@types'
import { createCategorySchema, updateCategorySchema, toggleCategorySchema } from './validations'

export function createCategoryService(repository: any) {
  return {
    create(data: unknown): Category {
      const parsed = createCategorySchema.parse(data)
      return repository.create(parsed.name)
    },

    list(): Category[] {
      return repository.findAll()
    },

    update(id: number, data: unknown) {
      const parsed = updateCategorySchema.parse(data)
      const category = repository.findById(id)
      if (!category) throw new Error('Category not found')
      repository.update(id, parsed.name)
    },

    toggle(id: number, data: unknown) {
      const parsed = toggleCategorySchema.parse(data)
      const category = repository.findById(id)
      if (!category) throw new Error('Category not found')
      repository.toggle(id, parsed.isActive)
    },

    async delete(id: number) {
      const category = repository.findById(id)
      if (!category) throw new Error('Category not found')

      // Set all products in this category to have no category (null)
      repository.setProductsCategoryToNull(id)

      // Delete the category
      return repository.delete(id)
    },

    countProducts(id: number): number {
      return repository.countProductsInCategory(id)
    }
  }
}
