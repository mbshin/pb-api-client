import { contextBridge, ipcRenderer } from 'electron'

type Status = 'Disconnected' | 'Connecting' | 'Connected'
type OutMode = 'hex' | 'utf8'

export type RenderTcp = {
  create(): Promise<{ ok: boolean; id?: number; message?: string }>
  connect(id: number, host: string, port: number): Promise<any>
  send(id: number, mode: OutMode, data: string): Promise<any>
  disconnect(id: number): Promise<any>
  destroy(id: number): Promise<any>

  // event channels are namespaced by id (e.g., tcp:3:data)
  onStatus(id: number, cb: (e: { status: Status; detail?: string }) => void): () => void
  onData(id: number, cb: (e: { bytesHex: string; bytesAscii: string }) => void): () => void
  onClosed(id: number, cb: (e: { reason: string }) => void): () => void
}

const api: RenderTcp = {
  create: () => ipcRenderer.invoke('tcp:create'),
  connect: (id, host, port) => ipcRenderer.invoke('tcp:connect', { id, host, port }),
  send: (id, mode, data) => ipcRenderer.invoke('tcp:send', { id, mode, data }),
  disconnect: (id) => ipcRenderer.invoke('tcp:disconnect', { id }),
  destroy: (id) => ipcRenderer.invoke('tcp:destroy', { id }),

  onStatus(id, cb) {
    const ch = `tcp:${id}:status`
    const listener = (_: any, e: any) => cb(e)
    ipcRenderer.on(ch, listener)
    return () => ipcRenderer.removeListener(ch, listener)
  },
  onData(id, cb) {
    const ch = `tcp:${id}:data`
    const listener = (_: any, e: any) => cb(e)
    ipcRenderer.on(ch, listener)
    return () => ipcRenderer.removeListener(ch, listener)
  },
  onClosed(id, cb) {
    const ch = `tcp:${id}:closed`
    const listener = (_: any, e: any) => cb(e)
    ipcRenderer.on(ch, listener)
    return () => ipcRenderer.removeListener(ch, listener)
  }
}

contextBridge.exposeInMainWorld('tcp', api)
export type PreloadTcpApi = typeof api
