import { ipcInvoke } from '../../../utils/ipc'
import type { PaymentMethod } from '@types'

export function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  return ipcInvoke<PaymentMethod[]>('payment-methods:list')
}

export function createPaymentMethod(
  data: Omit<PaymentMethod, 'id' | 'createdAt' | 'isActive'>
): Promise<PaymentMethod> {
  return ipcInvoke<PaymentMethod>('payment-methods:create', data)
}

export function updatePaymentMethod(
  id: number,
  data: Partial<Omit<PaymentMethod, 'id' | 'createdAt'>>
): Promise<void> {
  return ipcInvoke<void>('payment-methods:update', id, data)
}

export function togglePaymentMethod(id: number, isActive: boolean): Promise<void> {
  return ipcInvoke<void>('payment-methods:toggle', id, { isActive })
}
