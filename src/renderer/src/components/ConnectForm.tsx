import React, { useMemo, useState } from 'react'

type Status = 'Disconnected' | 'Connecting' | 'Connected'

type Props = {
  status: Status
  handleConnect: (host: string, port: number) => void | Promise<void>
  handleDisconnect: () => void | Promise<void>
}

export default function ConnectForm({ handleConnect, handleDisconnect, status }: Props) {
  const [host, setHost] = useState('localhost')
  const [orderPort, setOrderPort] = useState('8080')
  const [error, setError] = useState<string | null>(null)

  const statusColor = useMemo(() => {
    switch (status) {
      case 'Connected':
        return 'bg-green-100 text-green-700'
      case 'Connecting':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-red-100 text-red-700'
    }
  }, [status])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const portNum = Number(orderPort.trim())
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      setError('Please enter a valid port (1–65535).')
      return
    }

    try {
      await handleConnect(host.trim(), portNum)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect.')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      {/* Status */}
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500">Socket Status</div>
        <div
          className={`inline-block px-2 py-1 mt-1 text-xs font-semibold rounded ${statusColor}`}
          aria-live="polite"
        >
          {status}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 items-end">
        {/* Host */}
        <div className="flex flex-col">
          <label htmlFor="host" className="text-xs font-medium text-gray-600 mb-1">
            Host
          </label>
          <input
            id="host"
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="localhost"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={status !== 'Disconnected'}
            spellCheck={false}
          />
        </div>

        {/* Order Port */}
        <div className="flex flex-col">
          <label htmlFor="orderPort" className="text-xs font-medium text-gray-600 mb-1">
            Order Port
          </label>
          <input
            id="orderPort"
            type="number"
            inputMode="numeric"
            min={1}
            max={65535}
            value={orderPort}
            onChange={(e) => setOrderPort(e.target.value)}
            placeholder="8080"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={status !== 'Disconnected'}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="col-span-2 -mt-1 text-xs text-rose-600">{error}</div>
        )}

        {/* Button row (span both columns) */}
        <div className="col-span-2">
          {status === 'Disconnected' && (
            <button
              type="submit"
              className="w-full bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Connect
            </button>
          )}
          {status === 'Connecting' && (
            <button
              type="button"
              disabled
              className="w-full bg-yellow-500 text-white text-sm font-medium px-4 py-2 rounded-lg shadow opacity-80 cursor-not-allowed"
            >
              Connecting...
            </button>
          )}
          {status === 'Connected' && (
            <button
              type="button"
              onClick={handleDisconnect}
              className="w-full bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Disconnect
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
