import { createFlavorRepository } from './repository'
import { createFlavorSchema, updateFlavorSchema, updateStockSchema } from './validations'
import type { Flavor } from '@shared/types'

export function createFlavorService(repository: ReturnType<typeof createFlavorRepository>) {
    return {
        list(): Flavor[] {
            return repository.findAll()
        },

        create(data: unknown): Flavor {
            const parsed = createFlavorSchema.parse(data)
            // Check if name exists? The DB has UNIQUE constraint, so it will throw error.
            // We can let the DB handle it or check here.
            return repository.create(parsed)
        },

        update(id: number, data: unknown): void {
            const parsed = updateFlavorSchema.parse(data)
            const flavor = repository.findById(id)
            if (!flavor) throw new Error('Sabor no encontrado')
            repository.update(id, parsed)
        },

        updateStock(id: number, stock: number): void {
            const parsed = updateStockSchema.parse({ stock })
            const flavor = repository.findById(id)
            if (!flavor) throw new Error('Sabor no encontrado')
            repository.update(id, { stock: parsed.stock })
        },

        delete(id: number): void {
            const flavor = repository.findById(id)
            if (!flavor) throw new Error('Sabor no encontrado')
            repository.delete(id)
        }
    }
}
