import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import * as path from 'node:path'
import YAML from 'yaml'
import net from 'net'
import { Socket } from 'node:net'
import { TcpClient } from './TcpClient'
import { AppConfig } from './types'
import fs from 'node:fs'
import * as fss from 'node:fs/promises'

let mainWindow

function configPath(): string {
  // In dev: read from repo's ./config/config.yaml
  // In prod (packaged): place config next to app resources or under userData.
  if (!app.isPackaged) {
    return path.resolve(process.cwd(), 'config')
  }
  // Option A (read-only, bundled/next to resources):
  //   Put your file next to process.resourcesPath (e.g., in extraResources during packaging)
  //   return path.join(process.resourcesPath, 'config', 'config.yaml')

  // Option B (mutable, user-overridable):
  return path.join(app.getPath('userData'), 'config.yaml')
}
//
// let win: BrowserWindow | null = null

async function readYamlConfig(): Promise<any> {
  const cfgDir = configPath()
  const fp = path.join(cfgDir, 'config.yaml')

  const raw = await fss.readFile(fp, 'utf-8')
  return YAML.parse(raw)
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

// function getConfigDir(): string {
//   if (process.env.VITE_DEV_SERVER_URL) {
//     // Development mode - load from project directory
//     return path.join(process.cwd(), 'config')
//   }
//   // Production mode - load from resources
//   return path.join(process.resourcesPath, 'config')
// }

function loadConfig(): AppConfig {
  const cfgDir = configPath()
  const p = path.join(cfgDir, 'app.yaml')
  const yml = fs.readFileSync(p, 'utf-8')
  return YAML.parse(yml) as AppConfig
}

let client: TcpClient | null = null
let cfg: AppConfig
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  cfg = loadConfig()
  client = new TcpClient(cfg)
  // builder = new OrderBuilder(cfg)

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

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

// ipcMain.handle("ping", async  () => {
// console.log('pong11')
// return "pong20"
// });

ipcMain.handle('config:read', async () => {
  try {
    return { ok: true, data: await readYamlConfig() }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) }
  }
})

ipcMain.handle('ping', async (_event, msg) => {
  console.log(msg)
  return `pong: ${msg}`
})

// TCP Client functionality
let tcpClient: Socket

ipcMain.handle('connect-tcp', async (event, { host, port }) => {
  return new Promise((resolve, reject) => {
    try {
      tcpClient = new net.Socket()

      tcpClient.connect(port, host, () => {
        resolve({ success: true, message: `Connected to ${host}:${port}` })
      })

      tcpClient.on('data', (data) => {
        mainWindow.webContents.send('tcp-data-received', {
          data: data.toString(),
          timestamp: new Date().toISOString()
        })
      })

      tcpClient.on('error', (error) => {
        reject({ success: false, message: `Connection error: ${error.message}` })
      })

      tcpClient.on('close', () => {
        mainWindow.webContents.send('tcp-connection-closed', {
          message: 'Connection closed',
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      reject({ success: false, message: `Failed to create connection: ${error.message}` })
    }
  })
})

ipcMain.handle('send-tcp-data', async (event, { data, encoding = 'utf8' }) => {
  return new Promise((resolve, reject) => {
    if (!tcpClient || tcpClient.destroyed) {
      reject({ success: false, message: 'No active TCP connection' })
      return
    }

    try {
      tcpClient.write(data, encoding, (error) => {
        if (error) {
          reject({ success: false, message: `Failed to send data: ${error.message}` })
        } else {
          resolve({ success: true, message: 'Data sent successfully' })
        }
      })
    } catch (error) {
      reject({ success: false, message: `Error sending data: ${error.message}` })
    }
  })
})

ipcMain.handle('disconnect-tcp', async () => {
  return new Promise((resolve) => {
    if (tcpClient && !tcpClient.destroyed) {
      tcpClient.end()
      tcpClient.destroy()
      tcpClient = null
      resolve({ success: true, message: 'Disconnected successfully' })
    } else {
      resolve({ success: false, message: 'No active connection to disconnect' })
    }
  })
})

ipcMain.handle('get-connection-status', async () => {
  return {
    connected: tcpClient && !tcpClient.destroyed,
    remoteAddress: tcpClient ? tcpClient.remoteAddress : null,
    remotePort: tcpClient ? tcpClient.remotePort : null
  }
})

ipcMain.handle('send-order', async (event, order) => {
  // Serialize order to byte stream
  const orderIdBuf = Buffer.alloc(32, 0)
  orderIdBuf.write(order.orderId, 'utf8')
  const qtyBuf = Buffer.alloc(4)
  qtyBuf.writeInt32BE(Number(order.qty))
  const priceBuf = Buffer.alloc(8)
  priceBuf.writeDoubleBE(Number(order.price))
  const issueCodeBuf = Buffer.alloc(32, 0)
  issueCodeBuf.write(order.issueCode, 'utf8')
  const buffer = Buffer.concat([orderIdBuf, qtyBuf, priceBuf, issueCodeBuf])

  // Always send byte stream to renderer for log
  mainWindow.webContents.send('order-bytes', buffer.toString('hex'))

  return new Promise((resolve, reject) => {
    if (!tcpClient || tcpClient.destroyed) {
      resolve({
        success: false,
        message: 'No active TCP connection',
        buffer: buffer.toString('hex')
      })
      return
    }
    try {
      tcpClient.write(buffer, (error) => {
        if (error) {
          resolve({
            success: false,
            message: `Failed to send order: ${error.message}`,
            buffer: buffer.toString('hex')
          })
        } else {
          resolve({
            success: true,
            message: 'Order sent successfully',
            buffer: buffer.toString('hex')
          })
        }
      })
    } catch (error) {
      resolve({
        success: false,
        message: `Error sending order: ${error.message}`,
        buffer: buffer.toString('hex')
      })
    }
  })
})

ipcMain.handle('koscom:connect', async () => {
  await client!.connect()
  return 'connected'
})
ipcMain.handle('koscom:disconnect', async () => {
  client?.disconnect()
  return 'disconnected'
})

ipcMain.handle('koscom:send', async (_e, type: MessageType, payload: Payload) => {
  if (!client || !builder) throw new Error('Not ready')
  const buf = builder.build(type, payload)
  client.send(buf)
  return buf.toString('hex')
})
