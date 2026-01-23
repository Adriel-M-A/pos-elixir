import type { PaymentMethod } from '@types'
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  togglePaymentMethodSchema
} from './validations'

export function createPaymentMethodService(repository: any) {
  return {
    create(data: unknown): PaymentMethod {
      const parsed = createPaymentMethodSchema.parse(data)
      return repository.create(parsed.name)
    },

    list(): PaymentMethod[] {
      return repository.findAll()
    },

    update(id: number, data: unknown): void {
      const parsed = updatePaymentMethodSchema.parse(data)
      const method = repository.findById(id)
      if (!method) throw new Error('Payment method not found')
      repository.update(id, parsed.name)
    },

    toggle(id: number, data: unknown): void {
      const parsed = togglePaymentMethodSchema.parse(data)
      const method = repository.findById(id)
      if (!method) throw new Error('Payment method not found')
      repository.toggle(id, parsed.isActive)
    }
  }
}
