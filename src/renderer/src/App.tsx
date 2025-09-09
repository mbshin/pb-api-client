import { useEffect, useRef, useState } from 'react'
import ConnectForm from './components/ConnectForm'
import LogPanel from '@renderer/components/LogPanel'
import { Msg } from '@renderer/types'
import MessageForm from '@renderer/components/MessageForm'
// import LogPanel, { type Msg } from './components/LogPanel'

type Status = 'Disconnected' | 'Connecting' | 'Connected'

export default function App() {
  const [status, setStatus] = useState<Status>('Disconnected')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const clientIdRef = useRef<number | null>(null)
  const nextId = useRef(1)

  // helper to push logs
  function pushMsg(partial: Omit<Msg, 'id' | 'ts'>) {
    const id = String(nextId.current++)
    const ts = new Date().toISOString()
    setMsgs((prev) => [{ id, ts, ...partial }, ...prev].slice(0, 2000))
  }

  useEffect(() => {
    let offStatus = () => {}, offData = () => {}, offClosed = () => {}

    ;(async () => {
      // 1) Create a TCP client in main and get its id
      const r = await window.tcp.create()
      if (!r.ok || r.id == null) {
        pushMsg({ dir: 'out', ascii: `Failed to create TCP client: ${r.message ?? ''}` })
        return
      }
      clientIdRef.current = r.id

      // 2) Subscribe to events (namespaced by id)
      offStatus = window.tcp.onStatus(r.id, (e) => {
        setStatus(e.status)
        if (e.detail) pushMsg({ dir: 'out', ascii: `STATUS: ${e.status} (${e.detail})` })
      })
      offData = window.tcp.onData(r.id, (m) => {
        pushMsg({ dir: 'in', ascii: m.bytesAscii, hex: m.bytesHex })
      })
      offClosed = window.tcp.onClosed(r.id, () => setStatus('Disconnected'))
    })()

    // 3) Cleanup on unmount
    return () => {
      offStatus(); offData(); offClosed()
      const id = clientIdRef.current
      if (id != null) {
        window.tcp.destroy(id)
        clientIdRef.current = null
      }
    }
  }, [])

  // === These two go into ConnectForm props ===
  const handleConnect = async (host: string, port: number) => {
    const id = clientIdRef.current
    if (id == null) return
    pushMsg({ dir: 'out', ascii: `CONNECT ${host}:${port}` })
    const res = await window.tcp.connect(id, host, port)
    if (!res.ok) pushMsg({ dir: 'out', ascii: `CONNECT ERROR: ${res.message}` })
  }

  const handleDisconnect = async () => {
    const id = clientIdRef.current
    if (id == null) return
    await window.tcp.disconnect(id)
    pushMsg({ dir: 'out', ascii: 'DISCONNECT' })
  }

  async function handleSend(mode: 'utf8' | 'hex', data: string) {
    if (!data.trim()) return

    const id = clientIdRef.current

    try {
      const res = await window.tcp.send(id, mode, data)
      if (res.ok) {
        if (mode === 'utf8') {
          pushMsg({ dir: 'out', ascii: data })
        } else {
          pushMsg({ dir: 'out', hex: data })
        }
      } else {
        pushMsg({ dir: 'out', ascii: `SEND ERROR: ${res.message}` })
      }
    } catch (err: any) {
      pushMsg({ dir: 'out', ascii: `SEND FAILED: ${err.message}` })
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
        <div className="max-w-lg mx-auto mt-10 space-y-4">
          <ConnectForm handleConnect={handleConnect} handleDisconnect={handleDisconnect} status={status} />

          <LogPanel items={msgs} onClear={() => setMsgs([])} />
          <MessageForm isConnected={true} onSend={handleSend} />
          {/*<MessageLog messages={messages} />*/}

          {/*<pre>{JSON.stringify(state, null, 2)}</pre>*/}
          {/*<pre>{result}</pre>*/}
        </div>
      </div>
    </>
  )
}
