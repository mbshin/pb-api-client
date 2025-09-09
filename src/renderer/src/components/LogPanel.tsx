import { Msg } from '@renderer/types'

type Props = {
  items: Msg[]
  onClear?: () => void
}

export default function LogPanel({ items, onClear }: Props) {
  function fmt(ts: string) {
    const d = new Date(ts)
    return (
      d.toLocaleTimeString(undefined, { hour12: false }) +
      '.' +
      String(d.getMilliseconds()).padStart(3, '0')
    )
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Logs</h2>
        <button
          onClick={onClear}
          className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
        >
          Clear
        </button>
      </div>

      {/* Log List */}
      <div className="border border-gray-200 rounded-md bg-gray-50 h-80 overflow-auto p-2 text-xs font-mono">
        {items.length === 0 ? (
          <div className="text-gray-400 italic">No logs</div>
        ) : (
          items.map((m) => (
            <div
              key={m.id}
              className={`p-1 mb-1 rounded ${
                m.dir === 'in' ? 'bg-indigo-50' : 'bg-cyan-50'
              }`}
            >
              <span className="text-gray-500">{fmt(m.ts)}</span>{' '}
              <span className="font-bold">{m.dir.toUpperCase()}</span>{' '}
              {m.ascii && <span>ascii: {m.ascii}</span>}
              {m.hex && <span className="ml-2">hex: {m.hex}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
