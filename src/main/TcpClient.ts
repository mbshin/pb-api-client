import net from 'node:net'
import { AppConfig } from './types.js'

export class TcpClient {
  private socket?: net.Socket
  private cfg: AppConfig
  private recvBuf: Buffer = Buffer.alloc(0)
  private listeners: ((msg: Buffer) => void)[] = []

  constructor(cfg: AppConfig) {
    this.cfg = cfg
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && !this.socket.destroyed) {
        resolve()
        return
      }
      this.socket = new net.Socket()
      this.socket.once('error', reject)
      this.socket.connect(this.cfg.port, this.cfg.host, () => {
        this.socket?.off('error', reject)
        this.socket?.on('data', (chunk) => this.onData(chunk))
        resolve()
      })
    })
  }

  disconnect(): void {
    this.socket?.destroy()
    this.socket = undefined
    this.recvBuf = Buffer.alloc(0)
  }

  onMessage(cb: (msg: Buffer) => void) {
    this.listeners.push(cb)
  }

  send(buf: Buffer) {
    if (!this.socket || this.socket.destroyed) throw new Error('Socket not connected')
    if (this.cfg.log_send_hex) console.log('[SEND]', buf.toString('hex'))
    this.socket.write(buf)
  }

  private onData(chunk: Buffer) {
    if (this.cfg.log_recv_hex) console.log('[RECV]', chunk.toString('hex'))
    this.recvBuf = Buffer.concat([this.recvBuf, chunk])

    const be = (this.cfg.endian ?? 'BE') === 'BE'
    const includeHdr = this.cfg.length_includes_header

    while (true) {
      if (this.recvBuf.length < 4) return

      let len: number
      if (this.cfg.framing === 'ascii') {
        const asciiLen = this.recvBuf.subarray(0, 4).toString('ascii')
        len = parseInt(asciiLen, 10)
        if (Number.isNaN(len)) {
          this.recvBuf = Buffer.alloc(0)
          return
        }
      } else {
        len = be ? this.recvBuf.readUInt32BE(0) : this.recvBuf.readUInt32LE(0)
      }

      const total = includeHdr ? len : 4 + len
      if (this.recvBuf.length < total) return

      const payloadLen = total - 4
      const msg = this.recvBuf.subarray(4, 4 + payloadLen)
      this.recvBuf = this.recvBuf.subarray(total)
      this.listeners.forEach((cb) => cb(msg))
    }
  }
}
