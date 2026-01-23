import type { Database } from 'better-sqlite3'
import type { User } from '@shared/types'

export function createUserRepository(db: Database) {
    return {
        create(data: Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login'>): number {
            const stmt = db.prepare(`
        INSERT INTO users (username, password_hash, role, name, is_active, permissions, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)
            try {
                const info = stmt.run(
                    data.username,
                    data.password_hash,
                    data.role,
                    data.name,
                    data.is_active ? 1 : 0,
                    data.permissions ? JSON.stringify(data.permissions) : null
                )
                return Number(info.lastInsertRowid)
            } catch (error: any) {
                if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    throw new Error('USERNAME_EXISTS')
                }
                throw error
            }
        },

        update(id: number, data: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): void {
            const fields: string[] = []
            const values: any[] = []

            if (data.username !== undefined) {
                fields.push('username = ?')
                values.push(data.username)
            }
            if (data.name !== undefined) {
                fields.push('name = ?')
                values.push(data.name)
            }
            if (data.role !== undefined) {
                fields.push('role = ?')
                values.push(data.role)
            }
            if (data.is_active !== undefined) {
                fields.push('is_active = ?')
                values.push(data.is_active ? 1 : 0)
            }
            if (data.password_hash !== undefined) {
                fields.push('password_hash = ?')
                values.push(data.password_hash)
            }
            if (data.permissions !== undefined) {
                fields.push('permissions = ?')
                values.push(data.permissions ? JSON.stringify(data.permissions) : null)
            }

            fields.push('updated_at = datetime(\'now\')')

            if (fields.length === 1) return // only updated_at, skip if no data

            values.push(id)

            try {
                const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
                stmt.run(...values)
            } catch (error: any) {
                if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    throw new Error('USERNAME_EXISTS')
                }
                throw error
            }
        },

        async delete(id: number): Promise<void> {
            db.prepare('DELETE FROM users WHERE id = ?').run(id)
        },

        findById(id: number): User | undefined {
            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
            if (user && user.permissions) {
                try {
                    user.permissions = JSON.parse(user.permissions)
                } catch {
                    user.permissions = []
                }
            }
            return user as User | undefined
        },

        findAll(): User[] {
            const users = db.prepare('SELECT id, username, role, name, is_active, last_login, permissions, created_at, updated_at FROM users ORDER BY name').all() as any[]

            return users.map(user => {
                if (user.permissions) {
                    try {
                        user.permissions = JSON.parse(user.permissions)
                    } catch {
                        user.permissions = []
                    }
                }
                return user as User
            })
        }
    }
}
