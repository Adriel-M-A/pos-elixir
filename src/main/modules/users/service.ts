import { hashSync } from 'bcryptjs'
import type { User } from '@shared/types'
import { createUserRepository } from './repository'

export function createUserService(repository: ReturnType<typeof createUserRepository>) {
    return {
        create(data: Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login'> & { password?: string }) {
            if (!data.password) throw new Error('Password is required for new users')

            const password_hash = hashSync(data.password, 10)

            return repository.create({
                ...data,
                password_hash
            })
        },

        update(id: number, data: Partial<User> & { password?: string }) {
            const updateData: any = { ...data }

            if (data.password) {
                updateData.password_hash = hashSync(data.password, 10)
                delete updateData.password
            }

            return repository.update(id, updateData)
        },

        delete(id: number) {
            return repository.delete(id)
        },

        getAll() {
            return repository.findAll()
        },

        getById(id: number) {
            return repository.findById(id)
        }
    }
}
