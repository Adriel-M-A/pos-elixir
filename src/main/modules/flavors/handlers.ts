import { ipcMain } from 'electron'
import { createFlavorService } from './service'

export function registerFlavorHandlers(service: ReturnType<typeof createFlavorService>) {
    ipcMain.handle('flavors:list', async () => {
        try {
            return service.list()
        } catch (error) {
            console.error('Error in flavors:list:', error)
            throw error
        }
    })

    ipcMain.handle('flavors:create', async (_, data) => {
        try {
            return service.create(data)
        } catch (error) {
            console.error('Error in flavors:create:', error)
            throw error
        }
    })

    ipcMain.handle('flavors:update', async (_, id, data) => {
        try {
            return service.update(id, data)
        } catch (error) {
            console.error('Error in flavors:update:', error)
            throw error
        }
    })

    ipcMain.handle('flavors:update-stock', async (_, id, stock) => {
        try {
            return service.updateStock(id, stock)
        } catch (error) {
            console.error('Error in flavors:update-stock:', error)
            throw error
        }
    })

    ipcMain.handle('flavors:delete', async (_, id) => {
        try {
            return service.delete(id)
        } catch (error) {
            console.error('Error in flavors:delete:', error)
            throw error
        }
    })
}
