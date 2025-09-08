
// src/components/messages/ChatWindow.jsx
import { useState, useEffect, useRef } from 'react'
import { 
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline'
import { useMessages } from '../../hooks/useMessages'
import MessageBubble from './MessageBubble'
import Button from '../ui/Button'
import { formatDate } from '../../lib/utils'

export default function ChatWindow({ conversation, currentUser }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const { sendMessage, getConversationMessages } = useMessages()

  useEffect(() => {
    if (conversation?.id) {
      loadMessages()
    }
  }, [conversation?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const conversationMessages = await getConversationMessages(conversation.id)
      setMessages(conversationMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    try {
      setSending(true)
      const newMessage = await sendMessage({
        receiver_id: conversation.other_user.id,
        content: message.trim(),
        application_id: conversation.application_id
      })

      setMessages(prev => [...prev, newMessage])
      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {conversation.other_user?.avatar_url ? (
              <img
                src={conversation.other_user.avatar_url}
                alt={conversation.other_user.full_name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {conversation.other_user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              {conversation.other_user?.full_name || 'Unknown User'}
            </h3>
            {conversation.job_title && (
              <p className="text-sm text-gray-500">Re: {conversation.job_title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const showDate = index === 0 || 
                formatDate(messages[index - 1].created_at) !== formatDate(msg.created_at)
              
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="text-center py-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isOwnMessage={msg.sender_id === currentUser.id}
                  />
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
              <div className="absolute right-2 bottom-2 flex space-x-1">
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <PaperClipIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <FaceSmileIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <Button
            type="submit"
            disabled={!message.trim() || sending}
            loading={sending}
            className="flex-shrink-0"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}