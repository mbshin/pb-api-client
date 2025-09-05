import { useState } from 'react'

interface MessageFormProps {
  isConnected: boolean
  onSend: (msg: string) => void
  isLoading?: boolean
}

export default function MessageForm({ isConnected, onSend, isLoading = false }: MessageFormProps) {
  const [message, setMessage] = useState<string>('')

  const handleSend = () => {
    if (!message.trim()) return
    onSend(message)
    setMessage('') // clear after sending
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 mt-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Send Message</h2>

      <div className="space-y-4">
        {/* Message Field */}
        <div className="flex flex-col">
          <label htmlFor="message" className="text-xs font-medium text-gray-600 mb-1">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={isLoading || !message.trim() || isConnected}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium shadow
            ${
              isLoading || !message.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400'
            }`}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
