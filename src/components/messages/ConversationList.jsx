
// src/components/messages/ConversationList.jsx
import { formatDistanceToNow } from 'date-fns'
import { getInitials, getAvatarColor } from '../../lib/utils'

export default function ConversationList({ 
  conversations, 
  selectedConversation, 
  onSelectConversation 
}) {
  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
            selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          }`}
        >
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {conversation.other_user?.avatar_url ? (
                <img
                  src={conversation.other_user.avatar_url}
                  alt={conversation.other_user.full_name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(conversation.other_user?.full_name || 'U')}`}>
                  {getInitials(conversation.other_user?.full_name || 'User')}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {conversation.other_user?.full_name || 'Unknown User'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                </p>
              </div>
              
              <p className="text-sm text-gray-600 truncate mt-1">
                {conversation.last_message || 'No messages yet'}
              </p>

              {/* Unread indicator */}
              {conversation.unread_count > 0 && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {conversation.job_title && `Re: ${conversation.job_title}`}
                  </span>
                  <span className="inline-flex items-center justify-center h-5 w-5 bg-blue-600 text-white text-xs rounded-full">
                    {conversation.unread_count}
                  </span>
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
