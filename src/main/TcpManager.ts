// electron/TcpManager.ts
import { TcpClient } from './TcpClient.js'

export class TcpManager {
  private seq = 1
  private clients = new Map<number, TcpClient>()

  create(): { id: number; client: TcpClient } {
    const id = this.seq++
    const client = new TcpClient()
    this.clients.set(id, client)
    return { id, client }
  }

  get(id: number) {
    return this.clients.get(id) ?? null
  }

  destroy(id: number) {
    const c = this.clients.get(id)
    if (c) {
      c.disconnect()
      this.clients.delete(id)
    }
  }
}
