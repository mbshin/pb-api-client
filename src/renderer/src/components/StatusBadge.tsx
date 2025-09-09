// src/components/StatusBadge.tsx
export default function StatusBadge({ status }: { status: 'Disconnected' | 'Connecting' | 'Connected' }) {
  const map = {
    Connected:  'bg-emerald-100 text-emerald-700 ring-emerald-200',
    Connecting: 'bg-amber-100 text-amber-700 ring-amber-200',
    Disconnected: 'bg-rose-100 text-rose-700 ring-rose-200'
  } as const
  const color = map[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ring-1 ${color}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${
        status === 'Connected' ? 'bg-emerald-600' : status === 'Connecting' ? 'bg-amber-600' : 'bg-rose-600'
      }`} />
      {status}
    </span>
  )
}
