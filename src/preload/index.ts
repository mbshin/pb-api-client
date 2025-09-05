import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    //     contextBridge.exposeInMainWorld('api', {
    //   ping: () => {

    //     console.log("ping1")
    //       ipcRenderer.invoke("ping")
    //    return  'pong'
    // },
    // })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

contextBridge.exposeInMainWorld('api', {
  ping: async () => {
    return await ipcRenderer.invoke('ping', 'hello')
    // console.log("res" + ipcRenderer.invoke("ping"))
  },
  readConfig: async (): Promise<ReadConfigResult> => {
    return ipcRenderer.invoke('config:read')
  },
  // TCP Connection methods
  connectTCP: (host, port) => ipcRenderer.invoke('connect-tcp', { host, port }),
  sendTCPData: (data, encoding) => ipcRenderer.invoke('send-tcp-data', { data, encoding }),
  disconnectTCP: () => ipcRenderer.invoke('disconnect-tcp'),
  getConnectionStatus: () => ipcRenderer.invoke('get-connection-status'),

  // Event listeners
  onTCPDataReceived: (callback) => {
    ipcRenderer.on('tcp-data-received', (event, data) => callback(data));
  },
  onTCPConnectionClosed: (callback) => {
    ipcRenderer.on('tcp-connection-closed', (event, data) => callback(data));
  },
  onOrderBytes: (callback) => {
    ipcRenderer.on('order-bytes', (event, bytes) => callback(bytes));
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Order sending
  sendOrder: (order) => ipcRenderer.invoke('send-order', order),
})
