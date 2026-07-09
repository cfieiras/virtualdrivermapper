import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getDrives: () => ipcRenderer.invoke('get-drives'),
  getTakenLetters: () => ipcRenderer.invoke('get-taken-letters'),
  mapDrive: (drive: any) => ipcRenderer.invoke('map-drive', drive),
  unmapDrive: (letter: string) => ipcRenderer.invoke('unmap-drive', letter),
  getAutostart: () => ipcRenderer.invoke('get-autostart'),
  setAutostart: (enable: boolean) => ipcRenderer.invoke('set-autostart', enable)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
