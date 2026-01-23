import { ipcMain, BrowserWindow } from 'electron'

export function setupWindowIPC(mainWindow: BrowserWindow): void {
  ipcMain.on('window:minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.on('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('window:close', () => {
    mainWindow.close()
  })

  ipcMain.on('window:set-login-size', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    }
    mainWindow.setSize(400, 600)
    mainWindow.center()
    mainWindow.setResizable(false)
  })

  ipcMain.on('window:set-app-size', () => {
    mainWindow.setResizable(true)
    mainWindow.setSize(1200, 800)
    mainWindow.center()
    mainWindow.maximize()
  })
}
