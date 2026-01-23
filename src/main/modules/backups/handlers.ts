import { ipcMain } from 'electron'
import { createBackupService } from './service'

export function registerBackupHandlers(service: ReturnType<typeof createBackupService>) {
    ipcMain.handle('backup:create', async (_, type) => {
        try {
            return await service.create(type)
        } catch (error) {
            console.error('Error en backup:create:', error)
            throw error
        }
    })

    ipcMain.handle('backup:list', async () => {
        try {
            const backups = service.list()
            const config = service.getConfig()
            return { success: true, backups, path: config.backupPath, config }
        } catch (error) {
            console.error('Error en backup:list:', error)
            throw error
        }
    })

    ipcMain.handle('backup:restore', async (_, filename) => {
        try {
            return service.restore(filename)
        } catch (error) {
            console.error('Error en backup:restore:', error)
            throw error
        }
    })

    ipcMain.handle('backup:delete', async (_, filename) => {
        try {
            return service.delete(filename)
        } catch (error) {
            console.error('Error en backup:delete:', error)
            throw error
        }
    })

    ipcMain.handle('backup:get-config', async () => {
        return service.getConfig()
    })

    ipcMain.handle('backup:set-config', async (_, config) => {
        return service.setConfig(config)
    })

    ipcMain.handle('backup:select-folder', async () => {
        return service.selectFolder()
    })

    ipcMain.handle('backup:open-folder', async () => {
        return service.openFolder()
    })

    ipcMain.handle('backup:export', async (_, filename) => {
        return service.export(filename)
    })

    ipcMain.handle('backup:import', async () => {
        return service.import()
    })
}
