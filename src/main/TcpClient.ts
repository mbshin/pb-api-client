// electron/TcpClient.ts
import net from 'node:net'
import { EventEmitter } from 'node:events'

export type TcpStatus = 'Disconnected' | 'Connecting' | 'Connected'

export interface TcpDataEvent {
  bytesHex: string
  bytesAscii: string
}

export interface TcpStatusEvent {
  status: TcpStatus
  detail?: string
}

export interface TcpClosedEvent {
  reason: string
}

type Events = {
  status: (e: TcpStatusEvent) => void
  data: (e: TcpDataEvent) => void
  closed: (e: TcpClosedEvent) => void
  error: (err: Error) => void
}

export class TcpClient extends EventEmitter {
  private socket: net.Socket | null = null
  private _status: TcpStatus = 'Disconnected'

  constructor() {
    super()
  }

  get status() {
    return this._status
  }

  private setStatus(status: TcpStatus, detail?: string) {
    this._status = status
    this.emit('status', { status, detail })
  }

  async connect(host: string, port: number) {
    if (this.socket) this.disconnect()

    this.setStatus('Connecting', `${host}:${port}`)

    return await new Promise<{ ok: boolean; message: string }>((resolve) => {
      const sock = new net.Socket()
      sock.setNoDelay(true)

      sock.connect(port, host, () => {
        this.socket = sock``
        this.setStatus('Connected', `${host}:${port}`)
        resolve({ ok: true, message: `Connected to ${host}:${port}` })
      })

      sock.on('data', (data) => {
        this.emit('data', {
          bytesHex: data.toString('hex'),
          bytesAscii: data.toString('utf8')
        })
      })

      sock.on('close', () => {
        this.setStatus('Disconnected')
        if (this.socket === sock) this.socket = null
        this.emit('closed', { reason: 'remote-closed' })
      })

      sock.on('error', (err) => {
        this.setStatus('Disconnected', err.message)
        if (this.socket === sock) this.socket = null
        this.emit('error', err)
        resolve({ ok: false, message: `Connect error: ${err.message}` })
      })
    })
  }

  async send(mode: 'hex' | 'utf8', data: string) {
    if (!this.socket) return { ok: false, message: 'Not connected' }
    try {
      const buf =
        mode === 'hex'
          ? Buffer.from(data.replace(/\s+/g, ''), 'hex')
          : Buffer.from(data, 'utf8')
      this.socket.write(buf)
      return { ok: true, bytes: buf.length }
    } catch (e: any) {
      return { ok: false, message: e?.message ?? 'send failed' }
    }
  }

  disconnect() {
    if (this.socket) {
      try { this.socket.end(); this.socket.destroy() } catch {}
      this.socket = null
    }
    this.setStatus('Disconnected')
    this.emit('closed', { reason: 'local-disconnect' })
  }
}

// Type-safe on/emit helpers
export interface TcpClient {
  on<U extends keyof Events>(event: U, listener: Events[U]): this
  once<U extends keyof Events>(event: U, listener: Events[U]): this
  off<U extends keyof Events>(event: U, listener: Events[U]): this
  emit<U extends keyof Events>(event: U, ...args: Parameters<Events[U]>): boolean
}
