import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),

  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    setLoginSize: () => ipcRenderer.send('window:set-login-size'),
    setAppSize: () => ipcRenderer.send('window:set-app-size')
  }
})
