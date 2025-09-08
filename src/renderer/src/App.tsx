import { JSX, useEffect, useRef, useState } from 'react'
import ConnectForm from '@renderer/components/ConnectForm'
import { Status } from './types'
import MessageForm from '@renderer/components/MessageForm'
import MessageLog from '@renderer/components/MessageLog'

// type LoadState =
//   | { kind: 'idle' }
//   | { kind: 'loading' }
//   | { kind: 'error'; msg: string }
//   | { kind: 'ready'; cfg: string }

interface Message {
  id: number
  type: 'sent' | 'received'
  text: string
  timestamp: Date
}


export default function App(): JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const [result, setResult] = useState('')
  // const [status, setState] = useState<LoadState>({ kind: 'idle' })
  const [orderStatus, setOrderStaus] = useState<Status>('Disconnected')

  // const [isConnected, setIsConnected] = useState(false)
  // const [isLoading, setIsLoading] = useState(true)

  const [messages, setMessages] = useState<
    Message[]
  >([])

  useEffect(() => {
    // const offStatus = window.api.onStatus((s) => {
    //   setStatus(s.status)
    //   setDetail(s.detail)
    // })
    const offData = window.api.onData((m) => {
      console.log("here")
      console.log(m)
      addMessage(m.bytesAscii)
      // pushMsg({
      //   dir: 'in',
      //   ascii: m.bytesAscii,
      //   hex: m.bytesHex
      // })
    })
    // const offClosed = window.api.onClosed(() => {
    //   setStatus('Disconnected')
    // })
    return () => {
      // offStatus()
      offData()
      // offClosed()
    }
  }, [])


  const nextId = useRef(0)

  const addMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: nextId.current++,
        type: 'received',
        text: text,
        timestamp: new Date()
      }
    ])
  }


  // const handleClick = async (): Promise<void> => {
  //   // example: call Electron preload API
  //   const res = window.api?.ping()
  //   setResult(res)
  // }

  // const handleSend = (msg: string) => {
  //   setIsLoading(true)
  //   console.log('Sending message:', msg)
  //
  //   // Simulate async send
  //   setTimeout(() => {
  //     setIsLoading(false)
  //     console.log('Message sent:', msg)
  //   }, 1000)
  // }

  const handleConnect = async (host: string, port: string): Promise<void> => {
    try {
      const result = await window.api?.connect(host, parseInt(port))
      console.log(result)
      setOrderStaus('Connected')
    } catch (error) {
      // This handles thrown errors or reject() from the main process
      console.log(error)
      setOrderStaus('Disconnected')
    }
  }

  const handleSend = async (data) => {
    console.log('handle send')
    console.log(data)
    const result = await window.api?.send(data)
    console.log(result)
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
        <div className="max-w-lg mx-auto mt-10 space-y-4">
          <ConnectForm handleConnect={handleConnect} status={orderStatus} />
          <MessageForm isConnected={true} onSend={handleSend} />
          <MessageLog messages={messages} />

          {/*<pre>{JSON.stringify(state, null, 2)}</pre>*/}
          <pre>{result}</pre>
        </div>
      </div>
    </>
  )
}
