
// src/components/messages/MessageBubble.jsx
import { formatTime } from '../../lib/utils'

export default function MessageBubble({ message, isOwnMessage }) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwnMessage 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-200 text-gray-900'
      }`}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className={`text-xs mt-1 ${
          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}
