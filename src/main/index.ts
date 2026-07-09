import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import icon from '../../resources/icon.png?asset'

const execAsync = promisify(exec)

// Manejo de estado persistente (Simple JSON)
const storePath = join(app.getPath('userData'), 'drives_config.json')

function loadConfig() {
  if (fs.existsSync(storePath)) {
    return JSON.parse(fs.readFileSync(storePath, 'utf8'))
  }
  return []
}

function saveConfig(config: any) {
  fs.writeFileSync(storePath, JSON.stringify(config, null, 2))
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
} else {
  app.on('second-instance', () => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Restore drives on startup
  const config = loadConfig()
  config.forEach(async (drive: any) => {
    try {
      await execAsync(`C:\\Windows\\System32\\subst.exe ${drive.letter} "${drive.target}"`)
      if (drive.name) {
        const letterOnly = drive.letter.replace(':', '')
        await execAsync(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\DriveIcons\\${letterOnly}\\DefaultLabel" /ve /d "${drive.name}" /f`)
      }
    } catch (e) {
      console.error(`Failed to map ${drive.letter} on startup`, e)
    }
  })

// IPC Handlers
ipcMain.handle('get-drives', async () => {
  try {
    const { stdout } = await execAsync('C:\\Windows\\System32\\subst.exe')
    const config = loadConfig()
    // Parse output: Z:\: => C:\Path
    const activeDrives = stdout.split('\n').filter(Boolean).map(line => {
      const parts = line.split('=>')
      return {
        letter: parts[0].trim().replace('\\:', ''), // e.g. Z:
        target: parts[1].trim()
      }
    })
    
    // Obtener espacio
    const drivesData: any[] = []
    for (const drive of config) {
      const isActive = activeDrives.some(d => d.letter === drive.letter)
      let space: any = null
      if (isActive) {
        try {
          const { stdout: wmicOut } = await execAsync(`wmic logicaldisk where "DeviceID='${drive.letter}'" get FreeSpace,Size /value`)
          const freeMatch = wmicOut.match(/FreeSpace=(\d+)/)
          const sizeMatch = wmicOut.match(/Size=(\d+)/)
          if (freeMatch && sizeMatch) {
            space = {
              free: parseInt(freeMatch[1]),
              total: parseInt(sizeMatch[1])
            }
          }
        } catch (e) {
          // Ignorar si no se puede leer el espacio
        }
      }
      
      drivesData.push({
        ...drive,
        isActive,
        space
      })
    }
    return drivesData
  } catch (error: any) {
    console.error('Error getting drives:', error)
    return loadConfig()
  }
})

ipcMain.handle('map-drive', async (_, drive: { letter: string, target: string, name: string }) => {
  try {
    // 1. Ejecutar subst nativo
    await execAsync(`C:\\Windows\\System32\\subst.exe ${drive.letter} "${drive.target}"`)
    
    // 2. Establecer el nombre en el registro de Windows
    if (drive.name) {
      const letterOnly = drive.letter.replace(':', '')
      await execAsync(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\DriveIcons\\${letterOnly}\\DefaultLabel" /ve /d "${drive.name}" /f`)
    }
    
    // 3. Guardar en config
    const config = loadConfig()
    const index = config.findIndex((d: any) => d.letter === drive.letter)
    if (index >= 0) {
      config[index] = drive
    } else {
      config.push(drive)
    }
    saveConfig(config)
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('unmap-drive', async (_, letter: string) => {
  try {
    await execAsync(`C:\\Windows\\System32\\subst.exe ${letter} /D`)
    
    // Remover del registro
    const letterOnly = letter.replace(':', '')
    try {
      await execAsync(`reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\DriveIcons\\${letterOnly}" /f`)
    } catch (e) {
      // Ignore if doesn't exist
    }

    const config = loadConfig()
    saveConfig(config.filter((d: any) => d.letter !== letter))
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-taken-letters', async () => {
  try {
    const { stdout } = await execAsync('wmic logicaldisk get deviceid')
    // stdout looks like: "DeviceID \n C: \n D: \n ..."
    const matches = stdout.match(/[A-Z]:/g)
    return matches || []
  } catch (e) {
    return []
  }
})

ipcMain.handle('get-autostart', () => {
  return app.getLoginItemSettings().openAtLogin
})

ipcMain.handle('set-autostart', (_, enable: boolean) => {
  app.setLoginItemSettings({
    openAtLogin: enable,
    openAsHidden: true
  })
  return app.getLoginItemSettings().openAtLogin
})

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
