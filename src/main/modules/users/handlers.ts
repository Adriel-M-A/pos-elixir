import { ipcMain } from 'electron'
import { createUserService } from './service'

export function registerUserHandlers(service: ReturnType<typeof createUserService>) {
    ipcMain.handle('users:create', async (_, data) => {
        return service.create(data)
    })

    ipcMain.handle('users:update', async (_, id, data) => {
        return service.update(id, data)
    })

    ipcMain.handle('users:delete', async (_, id) => {
        return service.delete(id)
    })

    ipcMain.handle('users:list', async () => {
        return service.getAll()
    })
}
