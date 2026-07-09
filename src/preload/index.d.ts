import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getDrives: () => Promise<any[]>
      getTakenLetters: () => Promise<string[]>
      mapDrive: (drive: { letter: string, target: string, name: string }) => Promise<{ success: boolean, error?: string }>
      unmapDrive: (letter: string) => Promise<{ success: boolean, error?: string }>
      getAutostart: () => Promise<boolean>
      setAutostart: (enable: boolean) => Promise<boolean>
    }
  }
}
