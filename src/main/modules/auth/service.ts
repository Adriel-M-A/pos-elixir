import { compareSync } from 'bcryptjs'
import type { User } from '@shared/types'
import { FEATURE_FLAGS } from '../../config/features'
import { createAuthRepository } from './repository'

export function createAuthService(repository: ReturnType<typeof createAuthRepository>) {
    return {
        login(username: string, password: string): User {
            const user = repository.findUserByUsername(username)

            if (!user) {
                throw new Error('Usuario no encontrado')
            }

            if (!user.is_active) {
                throw new Error('Usuario inactivo')
            }

            const isValid = compareSync(password, user.password_hash)
            if (!isValid) {
                throw new Error('Credenciales inválidas')
            }

            repository.updateLastLogin(user.id)

            // Return user without sensitive data if possible, or just strict typing
            return user
        },

        autoLoginDefault(): User {
            if (FEATURE_FLAGS.ENABLE_USER_MANAGEMENT) {
                throw new Error('Modo multi-usuario activo. Login requerido.')
            }

            // En modo básico, usamos el ID 1 (Admin) por defecto
            const user = repository.findUserById(1)
            if (!user) {
                throw new Error('Usuario por defecto no encontrado. Ejecute las migraciones.')
            }
            return user
        },

        getFeatureConfig() {
            return FEATURE_FLAGS
        }
    }
}
