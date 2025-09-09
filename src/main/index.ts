import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { TcpClient } from './TcpClient'
import { TcpManager } from './TcpManager'


let mainWindow: BrowserWindow | null = null
const tcpManager = new TcpManager()

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
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


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // cfg = loadConfig()
  // client = new TcpClient(cfg)
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
  // ipcMain.on('ping', () => console.log('pong'))

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

/** Helper: wire one TcpClient to a specific BrowserWindow */
function pipeTcpToWindow(win: BrowserWindow, client: TcpClient, channelPrefix = 'tcp') {
  client.on('status', (e) => win.webContents.send(`${channelPrefix}:status`, e))
  client.on('data', (e) => win.webContents.send(`${channelPrefix}:data`, e))
  client.on('closed', (e) => win.webContents.send(`${channelPrefix}:closed`, e))
  client.on('error', (err) =>
    win.webContents.send(`${channelPrefix}:status`, { status: 'Disconnected', detail: err.message })
  )
}

// IPC API
ipcMain.handle('tcp:create', async (evt) => {
  const win = BrowserWindow.fromWebContents(evt.sender)
  if (!win) return { ok: false, message: 'No window' }
  const { id, client } = tcpManager.create()
  pipeTcpToWindow(win, client, `tcp:${id}`)
  return { ok: true, id }
})

ipcMain.handle('tcp:connect', async (_evt, { id, host, port }) => {
  const c = tcpManager.get(id)
  if (!c) return { ok: false, message: 'Invalid id' }
  return c.connect(host, port)
})

ipcMain.handle('tcp:send', async (_evt, { id, mode, data }) => {
  const c = tcpManager.get(id)
  if (!c) return { ok: false, message: 'Invalid id' }
  return c.send(mode, data)
})

ipcMain.handle('tcp:disconnect', async (_evt, { id }) => {
  const c = tcpManager.get(id)
  if (!c) return { ok: true }
  c.disconnect()
  return { ok: true }
})

ipcMain.handle('tcp:destroy', async (_evt, { id }) => {
  tcpManager.destroy(id)
  return { ok: true }
})


// ipcMain.handle('connect-tcp', async (_event, { host, port }) => {
//
//   if (tcpClient) {
//     try { tcpClient.destroy(); } catch {}
//     tcpClient = null
//   }
//
//   console.log("register handle")
//
//   return new Promise((resolve, reject) => {
//     const sock = new net.Socket()
//
//     sock.setNoDelay(true)
//
//     sock.connect(port, host, () => {
//       tcpClient = sock
//       // emitStatus('Connected', `${host}:${port}`)
//       resolve({ ok: true, message: `Connected to ${host}:${port}` })
//     })
//
//     sock.on('data', (data: Buffer) => {
//       console.log(data)
//       mainWindow?.webContents.send('tcp:data', {
//         bytesHex: data.toString('hex'),
//         bytesAscii: data.toString('utf8')
//       })
//     })
//
//     sock.on('close', () => {
//       // emitStatus('Disconnected')
//       if (tcpClient === sock) tcpClient = null
//       mainWindow?.webContents.send('tcp:closed', { reason: 'remote-closed' })
//     })
//
//     sock.on('error', (err) => {
//       // emitStatus('Disconnected', err.message)
//       if (tcpClient === sock) tcpClient = null
//       resolve({ ok: false, message: `Connect error: ${err.message}` })
//     })
//   })
// })
//
// ipcMain.handle('send-tcp-data', async (_event, { data, encoding = 'utf8' }) => {
//   return new Promise((resolve, reject) => {
//     if (!tcpClient || tcpClient.destroyed) {
//       reject({ success: false, message: 'No active TCP connection' })
//       return
//     }
//
//     try {
//       tcpClient.write(data, encoding, (error) => {
//         if (error) {
//           reject({ success: false, message: `Failed to send data: ${error.message}` })
//         } else {
//           resolve({ success: true, message: 'Data sent successfully' })
//         }
//       })
//     } catch (error) {
//       reject({ success: false, message: `Error sending data: ${error.message}` })
//     }
//
//
//   })
// })
//
//
// ipcMain.handle('tcp:disconnect', async () => {
//   if (tcpClient) {
//     try { tcpClient.end(); tcpClient.destroy(); } catch {}
//     tcpClient = null
//   }
//   // emitStatus('Disconnected')
//   return { ok: true }
// })
//

// ipcMain.handle('disconnect-tcp', async () => {
//   return new Promise((resolve) => {
//     if (tcpClient && !tcpClient.destroyed) {
//       tcpClient.end()
//       tcpClient.destroy()
//       tcpClient = null
//       resolve({ success: true, message: 'Disconnected successfully' })
//     } else {
//       resolve({ success: false, message: 'No active connection to disconnect' })
//     }
//   })
// })

// ipcMain.handle('get-connection-status', async () => {
//   return {
//     connected: tcpClient && !tcpClient.destroyed,
//     remoteAddress: tcpClient ? tcpClient.remoteAddress : null,
//     remotePort: tcpClient ? tcpClient.remotePort : null
//   }
// })

// ipcMain.handle('send-order', async (event, order) => {
//   // Serialize order to byte stream
//   const orderIdBuf = Buffer.alloc(32, 0)
//   orderIdBuf.write(order.orderId, 'utf8')
//   const qtyBuf = Buffer.alloc(4)
//   qtyBuf.writeInt32BE(Number(order.qty))
//   const priceBuf = Buffer.alloc(8)
//   priceBuf.writeDoubleBE(Number(order.price))
//   const issueCodeBuf = Buffer.alloc(32, 0)
//   issueCodeBuf.write(order.issueCode, 'utf8')
//   const buffer = Buffer.concat([orderIdBuf, qtyBuf, priceBuf, issueCodeBuf])

//   // Always send byte stream to renderer for log
//   mainWindow.webContents.send('order-bytes', buffer.toString('hex'))

//   return new Promise((resolve, reject) => {
//     if (!tcpClient || tcpClient.destroyed) {
//       resolve({
//         success: false,
//         message: 'No active TCP connection',
//         buffer: buffer.toString('hex')
//       })
//       return
//     }
//     try {
//       tcpClient.write(buffer, (error) => {
//         if (error) {
//           resolve({
//             success: false,
//             message: `Failed to send order: ${error.message}`,
//             buffer: buffer.toString('hex')
//           })
//         } else {
//           resolve({
//             success: true,
//             message: 'Order sent successfully',
//             buffer: buffer.toString('hex')
//           })
//         }
//       })
//     } catch (error) {
//       resolve({
//         success: false,
//         message: `Error sending order: ${error.message}`,
//         buffer: buffer.toString('hex')
//       })
//     }
//   })
// })

// ipcMain.handle('koscom:connect', async () => {
//   await client!.connect()
//   return 'connected'
// })
// ipcMain.handle('koscom:disconnect', async () => {
//   client?.disconnect()
//   return 'disconnected'
// })

// ipcMain.handle('koscom:send', async (_e, type: MessageType, payload: Payload) => {
//   if (!client || !builder) throw new Error('Not ready')
//   const buf = builder.build(type, payload)
//   client.send(buf)
//   return buf.toString('hex')
// })

// ipcMain.handle("ping", async  () => {
// console.log('pong11')
// return "pong20"
// });

// ipcMain.handle('config:read', async () => {
//   try {
//     return { ok: true, data: await readYamlConfig() }
//   } catch (err: any) {
//     return { ok: false, error: err?.message ?? String(err) }
//   }
// })
//
// ipcMain.handle('ping', async (_event, msg) => {
//   console.log(msg)
//   return `pong: ${msg}`
// })

// TCP Client functionality
// let tcpClient: Socket


// function configPath(): string {
//   // In dev: read from repo's ./config/config.yaml
//   // In prod (packaged): place config next to app resources or under userData.
//   if (!app.isPackaged) {
//     return path.resolve(process.cwd(), 'config')
//   }
//   // Option A (read-only, bundled/next to resources):
//   //   Put your file next to process.resourcesPath (e.g., in extraResources during packaging)
//   //   return path.join(process.resourcesPath, 'config', 'config.yaml')
//
//   // Option B (mutable, user-overridable):
//   return path.join(app.getPath('userData'), 'config.yaml')
// }
// //
// let win: BrowserWindow | null = null

// nullasync function readYamlConfig(): Promise<any> {
//   const cfgDir = configPath()
//   const fp = path.join(cfgDir, 'config.yaml')
//
//   const raw = await fss.readFile(fp, 'utf-8')
//   return YAML.parse(raw)
// }


// / function getConfigDir(): string {
//   if (process.env.VITE_DEV_SERVER_URL) {
//     // Development mode - load from project directory
//     return path.join(process.cwd(), 'config')
//   }
//   // Production mode - load from resources
//   return path.join(process.resourcesPath, 'config')
// }

// function loadConfig(): AppConfig {
//   const cfgDir = configPath()
//   const p = path.join(cfgDir, 'app.yaml')
//   const yml = fs.readFileSync(p, 'utf-8')
//   return YAML.parse(yml) as AppConfig
// }

// let client: TcpClient | null = null
// let cfg: AppConfig
