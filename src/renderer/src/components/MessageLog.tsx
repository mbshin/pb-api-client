interface Message {
  id: number
  type: 'sent' | 'received'
  text: string
  timestamp: Date
}

interface MessageLogProps {
  messages: Message[]
}

export default function MessageLog({ messages }: MessageLogProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 mt-4 h-64 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Message Log</h2>

      {messages.length === 0 ? (
        <div className="text-gray-400 text-sm">No messages yet.</div>
      ) : (
        <ul className="space-y-2">
          {messages.map((msg) => (
            <li
              key={msg.id}
              className={`flex flex-col ${msg.type === 'sent' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`px-3 py-2 rounded-lg max-w-xs text-sm shadow
                  ${msg.type === 'sent' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-400 mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
