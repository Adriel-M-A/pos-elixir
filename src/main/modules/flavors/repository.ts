import type { Database } from 'better-sqlite3'
import type { Flavor } from '@shared/types'

export function createFlavorRepository(db: Database) {

    return {
        findAll(): Flavor[] {
            const stmt = db.prepare('SELECT id, name, stock, is_active as isActive FROM flavors ORDER BY name ASC')
            const rows = stmt.all() as any[]
            return rows.map((row) => ({
                ...row,
                isActive: Boolean(row.isActive)
            }))
        },

        findById(id: number): Flavor | undefined {
            const stmt = db.prepare('SELECT id, name, stock, is_active as isActive FROM flavors WHERE id = ?')
            const row = stmt.get(id) as any
            if (!row) return undefined
            return {
                ...row,
                isActive: Boolean(row.isActive)
            }
        },

        create(data: Omit<Flavor, 'id'>): Flavor {
            const stmt = db.prepare(`
        INSERT INTO flavors (name, stock, is_active)
        VALUES (@name, @stock, @isActive)
      `)

            const info = stmt.run({
                name: data.name,
                stock: data.stock,
                isActive: data.isActive ? 1 : 0
            })

            return {
                id: Number(info.lastInsertRowid),
                ...data
            }
        },

        update(id: number, data: Partial<Omit<Flavor, 'id'>>): void {
            const updates: string[] = []
            const params: any = { id }

            if (data.name !== undefined) {
                updates.push('name = @name')
                params.name = data.name
            }
            if (data.stock !== undefined) {
                updates.push('stock = @stock')
                params.stock = data.stock
            }
            if (data.isActive !== undefined) {
                updates.push('is_active = @isActive')
                params.isActive = data.isActive ? 1 : 0
            }

            if (updates.length === 0) return

            const stmt = db.prepare(`UPDATE flavors SET ${updates.join(', ')} WHERE id = @id`)
            stmt.run(params)
        },

        delete(id: number): void {
            const stmt = db.prepare('DELETE FROM flavors WHERE id = ?')
            stmt.run(id)
        }
    }
}
