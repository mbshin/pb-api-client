// src/hooks/useTcpClient.ts
import { useEffect, useRef, useState } from 'react'

export type Status = 'Disconnected' | 'Connecting' | 'Connected'

export type Message = {
  id: string
  dir: 'in' | 'out'
  ts: string
  ascii?: string
  hex?: string
}

export function useTcpClient() {
  const [status, setStatus] = useState<Status>('Disconnected')
  const [messages, setMessages] = useState<Message[]>([])
  const clientIdRef = useRef<number | null>(null)
  const nextId = useRef(1)

  function push(m: Omit<Message, 'id' | 'ts'>) {
    const id = String(nextId.current++)
    const ts = new Date().toISOString()
    setMessages((prev) => [{ id, ts, ...m }, ...prev].slice(0, 2000))
  }

  useEffect(() => {
    let offStatus = () => {}, offClosed = () => {}, offData = () => {}

    ;(async () => {
      const r = await window.tcp.create()
      if (!r.ok || r.id == null) return
      clientIdRef.current = r.id

      offStatus = window.tcp.onStatus(r.id, (e) => setStatus(e.status))
      offClosed = window.tcp.onClosed(r.id, () => setStatus('Disconnected'))
      offData = window.tcp.onData(r.id, (m) => {
        push({ dir: 'in', ascii: m.bytesAscii, hex: m.bytesHex })
      })
    })()

    return () => {
      offStatus(); offClosed(); offData()
      const id = clientIdRef.current
      if (id != null) window.tcp.destroy(id)
      clientIdRef.current = null
    }
  }, [])

  async function connect(host: string, port: number) {
    const id = clientIdRef.current
    if (id == null) return { ok: false, message: 'no client' }
    return window.tcp.connect(id, host, port)
  }

  async function disconnect() {
    const id = clientIdRef.current
    if (id == null) return { ok: true }
    return window.tcp.disconnect(id)
  }

  async function send(mode: 'utf8' | 'hex', data: string) {
    const id = clientIdRef.current
    if (id == null) return { ok: false, message: 'no client' }
    const res = await window.tcp.send(id, mode, data)
    if (res.ok) {
      push(mode === 'utf8' ? { dir: 'out', ascii: data } : { dir: 'out', hex: data })
    }
    return res
  }

  return { status, connect, disconnect, send, messages, clear: () => setMessages([]) }
}
