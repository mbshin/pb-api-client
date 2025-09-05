import React, { useState } from 'react'

// reusable type
type Status = 'Disconnected' | 'Connecting' | 'Connected'

export default function ConnectForm() {
  const [host, setHost] = useState<string>('localhost')
  const [orderPort, setOrderPort] = useState<string>('8080')
  const [execPort, setExecPort] = useState<string>('8081')
  const [status, setStatus] = useState<Status>('Disconnected')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Connecting to', host, orderPort, execPort)

    setStatus('Connecting')

    setTimeout(() => {
      setStatus('Connected')
    }, 1000)
  }

  const statusColor =
    status === 'Connected'
      ? 'bg-green-100 text-green-700'
      : status === 'Connecting'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-red-100 text-red-700'

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      {/* Status Section */}
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500">Socket Status</div>
        <div className={`inline-block px-2 py-1 mt-1 text-xs font-semibold rounded ${statusColor}`}>
          {status}
        </div>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3 items-end">
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
          />
        </div>

        {/* Order Port */}
        <div className="flex flex-col">
          <label htmlFor="orderPort" className="text-xs font-medium text-gray-600 mb-1">
            Order Port
          </label>
          <input
            id="orderPort"
            type="text"
            value={orderPort}
            onChange={(e) => setOrderPort(e.target.value)}
            placeholder="8080"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Execution Port */}
        <div className="flex flex-col">
          <label htmlFor="execPort" className="text-xs font-medium text-gray-600 mb-1">
            Execution Port
          </label>
          <input
            id="execPort"
            type="text"
            value={execPort}
            onChange={(e) => setExecPort(e.target.value)}
            placeholder="8081"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Submit Button (full width across 3 columns) */}
        <div className="col-span-3">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Connect
          </button>
        </div>
      </form>
    </div>
  )
}
