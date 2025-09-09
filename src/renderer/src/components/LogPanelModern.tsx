// src/components/LogPanelModern.tsx
import React from 'react'

export type Msg = {
  id: string
  dir: 'in' | 'out'
  ascii?: string
  hex?: string
  ts: string
}

export default function LogPanelModern({ items, onClear }: { items: Msg[]; onClear?: () => void }) {
  function fmt(ts: string) {
    const d = new Date(ts)
    const time = d.toLocaleTimeString(undefined, { hour12: false })
    const ms = String(d.getMilliseconds()).padStart(3, '0')
    return `${time}.${ms}`
  }

  return (
    <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50/80 dark:bg-gray-900/60">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-300">Traffic</div>
        <button
          onClick={onClear}
          className="text-xs px-2 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                     hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Clear
        </button>
      </div>

      <div className="h-64 overflow-auto bg-white/60 dark:bg-gray-950/60 backdrop-blur-sm px-3 py-2 text-[12px] font-mono">
        {items.length === 0 ? (
          <div className="text-gray-400 italic">No logs</div>
        ) : (
          items.map((m) => (
            <div
              key={m.id}
              className={`mb-1.5 rounded-xl border px-3 py-2 ${
                m.dir === 'in'
                  ? 'bg-indigo-50/80 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900'
                  : 'bg-cyan-50/80 border-cyan-100 dark:bg-cyan-950/20 dark:border-cyan-900'
              }`}
            >
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <span className="text-[11px]">{fmt(m.ts)}</span>
                <span className="uppercase text-[10px] px-1.5 py-0.5 rounded-full
                                  bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                  {m.dir}
                </span>
              </div>
              <div className="mt-1 text-gray-900 dark:text-gray-100 break-words">
                {m.ascii && <div>ascii: {m.ascii}</div>}
                {m.hex && <div className="mt-0.5">hex: {m.hex}</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
