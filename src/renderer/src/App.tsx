import { JSX, useEffect, useState } from 'react'
import ConnectForm from '@renderer/components/ConnectForm'
import { Status } from './types'
import MessageForm from '@renderer/components/MessageForm'

// type LoadState =
//   | { kind: 'idle' }
//   | { kind: 'loading' }
//   | { kind: 'error'; msg: string }
//   | { kind: 'ready'; cfg: string }


export default function App(): JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const [result, setResult] = useState('')
  // const [status, setState] = useState<LoadState>({ kind: 'idle' })
  const [orderStatus, setOrderStaus] = useState<Status>('Disconnected')

  // const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      // setState({ kind: 'loading' })
      // const res = await window.api.readConfig()
      if (!mounted) return
      // if (res.ok) setState({ kind: 'ready', cfg: res.data })
      // else setState({ kind: 'error', msg: res.error })

      setIsLoading(true)
      setOrderStaus('Disconnected')
    })()
    return () => {
      mounted = false
    }
  }, [])

  const handleClick = async (): Promise<void> => {
    // example: call Electron preload API
    const res = window.api?.ping()
    setResult(res)
  }

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
    console.log("handle send")
    console.log(data)
    const result = await window.api?.send(data)
    console.log(result)
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
        <div className="max-w-lg mx-auto mt-10 space-y-4">
          <button onClick={handleClick}>Load Config</button>

          <ConnectForm handleConnect={handleConnect} status={orderStatus} />
          <MessageForm isConnected={true} onSend={handleSend} />
          {/*<MessageLog*/}
          {/*  messages={[*/}
          {/*    {*/}
          {/*      id: 1,*/}
          {/*      type: 'sent',*/}
          {/*      text: 'gjlsajglsajglsajglsagd',*/}
          {/*      timestamp: new Date(Date.now() - 1000 * 60 * 5)*/}
          {/*    },{*/}
          {/*      id: 1,*/}
          {/*      type: 'received',*/}
          {/*      text: 'gjlsajglsajglsajglsagd',*/}
          {/*      timestamp: new Date(Date.now() - 1000 * 60 * 5)*/}
          {/*    }*/}
          {/*  ]}*/}
          {/*/>*/}

          {/*<pre>{JSON.stringify(state, null, 2)}</pre>*/}
          <pre>{result}</pre>
        </div>
      </div>
    </>
  )
}
