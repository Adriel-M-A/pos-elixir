import type { Database } from 'better-sqlite3'
import type { User } from '@shared/types'

export function createAuthRepository(db: Database) {
    return {
        findUserByUsername(username: string): User | undefined {
            const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
            if (user && user.permissions) {
                try {
                    user.permissions = JSON.parse(user.permissions)
                } catch {
                    user.permissions = []
                }
            }
            return user as User | undefined
        },

        findUserById(id: number): User | undefined {
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

        getAllUsers(): User[] {
            return db.prepare('SELECT id, username, role, name, is_active, last_login, created_at, updated_at FROM users').all() as User[]
        },

        createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login'>): number {
            const stmt = db.prepare(`
            INSERT INTO users (username, password_hash, role, name, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `)
            const info = stmt.run(user.username, user.password_hash, user.role, user.name, user.is_active ? 1 : 0)
            return Number(info.lastInsertRowid)
        },

        updateLastLogin(userId: number) {
            db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(userId)
        }
    }
}
