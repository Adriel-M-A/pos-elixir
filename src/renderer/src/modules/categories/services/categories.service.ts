import { ipcInvoke } from '../../../utils/ipc'
import type { Category } from '@types'

export function fetchCategories(): Promise<Category[]> {
  return ipcInvoke<Category[]>('categories:list')
}

export function createCategory(
  data: Omit<Category, 'id' | 'createdAt' | 'isActive'>
): Promise<Category> {
  return ipcInvoke<Category>('categories:create', data)
}

export function updateCategory(
  id: number,
  data: Partial<Omit<Category, 'id' | 'createdAt'>>
): Promise<void> {
  return ipcInvoke<void>('categories:update', id, data)
}

export function toggleCategory(id: number, isActive: boolean): Promise<void> {
  return ipcInvoke<void>('categories:toggle', id, { isActive })
}

export function deleteCategory(id: number): Promise<void> {
  return ipcInvoke<void>('categories:delete', id)
}

export function countProductsInCategory(id: number): Promise<number> {
  return ipcInvoke<number>('categories:count-products', id)
}
