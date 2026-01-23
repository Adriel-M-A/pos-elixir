import { ipcInvoke } from '../../../utils/ipc'
import type { User } from '@shared/types'

export const loadUsers = async (): Promise<User[]> => {
    return await ipcInvoke<User[]>('users:list')
}

export const createUser = async (user: Partial<User> & { password?: string }): Promise<number> => {
    const result = await ipcInvoke<number>('users:create', user)
    window.dispatchEvent(new Event('users-updated'))
    return result
}

export const updateUser = async (id: number, user: Partial<User> & { password?: string }): Promise<void> => {
    await ipcInvoke<void>('users:update', id, user)
    window.dispatchEvent(new Event('users-updated'))
}

export const deleteUser = async (id: number): Promise<void> => {
    await ipcInvoke<void>('users:delete', id)
    window.dispatchEvent(new Event('users-updated'))
}
