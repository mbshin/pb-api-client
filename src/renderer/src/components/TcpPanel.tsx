// src/components/TcpPanelModern.tsx
import React, { ReactNode, useState } from 'react'
import StatusBadge from './StatusBadge'
import { useTcpClient } from '../hooks/useTcpClient'
import LogPanelModern from './LogPanelModern'


type Props = {
  title: string
  defaultHost?: string
  defaultPort?: number
  children?: (opts: {
    status: 'Disconnected' | 'Connecting' | 'Connected'
    send: (mode: 'utf8' | 'hex', data: string) => Promise<any>
  }) => ReactNode
}

export default function TcpPanelModern({
                                         title,
                                         defaultHost = '127.0.0.1',
                                         defaultPort = 0,
                                         children
                                       }:
  Props
) {
  const { status, connect, disconnect, send, messages, clear } = useTcpClient()
  const [host, setHost] = useState(defaultHost)
  const [port, setPort] = useState(String(defaultPort))
  const [mode, setMode] = useState<'utf8' | 'hex'>('utf8')
  const [out, setOut] = useState('')

  const canConnect = status === 'Disconnected'
  const canDisconnect = status === 'Connected'

  return (
    <div className="group rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm
                    shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-800/60
                      bg-gradient-to-r from-indigo-50/60 to-sky-50/60 dark:from-indigo-950/30 dark:to-sky-950/20 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white grid place-items-center text-sm font-semibold shadow-sm">
            {title.slice(0,1).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</div>
            <div className="text-xs text-gray-500">TCP Client</div>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Connection row */}
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-5">
            <label className="block text-[11px] text-gray-500 mb-1">Host</label>
            <input
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm
                         focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              disabled={!canConnect}
              spellCheck={false}
            />
          </div>
          <div className="col-span-3">
            <label className="block text-[11px] text-gray-500 mb-1">Port</label>
            <input
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm
                         focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              inputMode="numeric"
              disabled={!canConnect}
            />
          </div>
          <div className="col-span-2 flex items-end">
            <button
              onClick={() => connect(host, Number(port))}
              disabled={!canConnect}
              className="w-full rounded-xl bg-indigo-600 text-white text-sm font-medium px-3 py-2 shadow-sm
                         enabled:hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
            >
              Connect
            </button>
          </div>
          <div className="col-span-2 flex items-end">
            <button
              onClick={disconnect}
              disabled={!canDisconnect}
              className="w-full rounded-xl bg-rose-600 text-white text-sm font-medium px-3 py-2 shadow-sm
                         enabled:hover:bg-rose-700 focus:ring-2 focus:ring-rose-400 disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Send row */}
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-9">
            <label className="block text-[11px] text-gray-500 mb-1">Message</label>
            <textarea
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm
                         focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60"
              rows={3}
              value={out}
              onChange={(e) => setOut(e.target.value)}
              placeholder={mode === 'utf8' ? 'Type UTF-8 text…' : 'Type hex (e.g. 48 65 6C 6C 6F)…'}
              disabled={!canDisconnect}
            />
          </div>
          <div className="col-span-3 flex flex-col gap-2">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Mode</label>
              <div className="grid grid-cols-2 rounded-xl border border-gray-300 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => setMode('utf8')}
                  className={`py-2 text-sm ${mode==='utf8' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'}`}
                >
                  utf8
                </button>
                <button
                  onClick={() => setMode('hex')}
                  className={`py-2 text-sm ${mode==='hex' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'}`}
                >
                  hex
                </button>
              </div>
            </div>
            <button
              onClick={async () => { if (!out.trim()) return; const r = await send(mode, out); if (r.ok) setOut('') }}
              disabled={!canDisconnect || !out.trim()}
              className="w-full rounded-xl bg-gray-900 text-white text-sm font-medium px-3 py-2 shadow-sm
                         enabled:hover:bg-black focus:ring-2 focus:ring-gray-400 disabled:opacity-50 dark:bg-white dark:text-gray-900"
            >
              Send
            </button>
          </div>
        </div>

        {/* Extra children (like OrderForm) */}
        {children && (
          <div className="px-4 pb-4">
            {children({ status, send })}
          </div>
        )}

        {/* Log */}
        <LogPanelModern items={messages} onClear={clear} />
      </div>
    </div>
  )
}
