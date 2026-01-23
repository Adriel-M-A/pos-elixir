import { ipcInvoke } from '../../../utils/ipc'
import type { Product } from '@types'

export function fetchProducts(): Promise<Product[]> {
  return ipcInvoke<Product[]>('products:list')
}

export function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'isActive'>
): Promise<Product> {
  return ipcInvoke<Product>('products:create', data)
}

export function updateProduct(
  id: number,
  data: Partial<Omit<Product, 'id' | 'createdAt'>>
): Promise<void> {
  return ipcInvoke<void>('products:update', id, data)
}

export function toggleProduct(id: number, isActive: boolean): Promise<void> {
  return ipcInvoke<void>('products:toggle', id, { isActive })
}

export function deleteProduct(id: number): Promise<void> {
  return ipcInvoke<void>('products:delete', id)
}

export function findPromotionsByProductId(id: number): Promise<string[]> {
  return ipcInvoke<string[]>('products:find-promotions', id)
}
