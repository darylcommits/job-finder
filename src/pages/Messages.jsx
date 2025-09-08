// src/pages/Messages.jsx - Fixed version that works with your current schema
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  EllipsisVerticalIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

import { useAuth } from '../contexts/AuthContext'
import { supabase, TABLES, USER_ROLES } from '../lib/supabase'
import { formatDate, timeAgo, getInitials, getAvatarColor } from '../lib/utils'

export default function Messages() {
  const { profile } = useAuth()
  const location = useLocation()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (profile?.id) {
      fetchConversations()
    }
  }, [profile?.id])

  // Handle navigation from other pages with specific conversation
  useEffect(() => {
    if (location.state?.selectedApplicationId && conversations.length > 0) {
      const conversation = conversations.find(
        conv => conv.application_id === location.state.selectedApplicationId
      )
      if (conversation) {
        setSelectedConversation(conversation)
      }
    }
  }, [location.state, conversations])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.application_id)
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel(`messages:${selectedConversation.application_id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `application_id=eq.${selectedConversation.application_id}`
          },
          (payload) => {
            console.log('📧 New message received:', payload.new)
            setMessages(prev => [...prev, payload.new])
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching conversations for user:', profile.id)
      
      // First, get all messages where user is either sender or recipient
      const { data: allMessages, error: messagesError } = await supabase
        .from(TABLES.MESSAGES || 'messages')
        .select('*')
        .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })

      if (messagesError) {
        console.error('❌ Error fetching messages:', messagesError)
        throw messagesError
      }

      if (!allMessages || allMessages.length === 0) {
        console.log('📝 No messages found')
        setConversations([])
        return
      }

      console.log('📊 Found messages:', allMessages.length)

      // Get unique application IDs and other participant IDs
      const applicationIds = [...new Set(allMessages.map(msg => msg.application_id).filter(Boolean))]
      const participantIds = [...new Set(allMessages.map(msg => 
        msg.sender_id === profile.id ? msg.recipient_id : msg.sender_id
      ).filter(Boolean))]

      // Fetch applications data
      let applicationsData = []
      if (applicationIds.length > 0) {
        const { data: applications, error: appsError } = await supabase
          .from(TABLES.APPLICATIONS || 'applications')
          .select(`
            id,
            status,
            applicant_id,
            job_id,
            jobs:job_id (
              id,
              title,
              employer_id
            )
          `)
          .in('id', applicationIds)

        if (appsError) {
          console.warn('⚠️ Error fetching applications:', appsError)
        } else {
          applicationsData = applications || []
        }
      }

      // Fetch participant profiles
      let profilesData = []
      if (participantIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', participantIds)

        if (profilesError) {
          console.warn('⚠️ Error fetching profiles:', profilesError)
        } else {
          profilesData = profiles || []
        }
      }

      // Group messages by application_id and get the latest message for each
      const conversationMap = new Map()
      
      allMessages.forEach(message => {
        const appId = message.application_id
        if (!appId) return // Skip messages without application_id
        
        const existing = conversationMap.get(appId)
        if (!existing || new Date(message.created_at) > new Date(existing.created_at)) {
          // Find the other participant
          const otherParticipantId = message.sender_id === profile.id 
            ? message.recipient_id 
            : message.sender_id
            
          const otherParticipant = profilesData.find(p => p.id === otherParticipantId)
          const applicationData = applicationsData.find(app => app.id === appId)
          
          conversationMap.set(appId, {
            ...message,
            application_id: appId,
            other_participant: otherParticipant || {
              id: otherParticipantId,
              full_name: 'Unknown User',
              avatar_url: null,
              email: null
            },
            application: applicationData || null,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: 0 // You can implement unread count logic later
          })
        }
      })

      const conversationsList = Array.from(conversationMap.values())
      console.log('✅ Successfully grouped conversations:', conversationsList.length)
      setConversations(conversationsList)
      
    } catch (error) {
      console.error('❌ Error fetching conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (applicationId) => {
    try {
      setMessagesLoading(true)
      console.log('💬 Fetching messages for application:', applicationId)
      
      const { data: messagesData, error } = await supabase
        .from(TABLES.MESSAGES || 'messages')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error fetching messages:', error)
        throw error
      }

      // Get sender profiles for the messages
      const senderIds = [...new Set(messagesData?.map(msg => msg.sender_id) || [])]
      
      let sendersData = []
      if (senderIds.length > 0) {
        const { data: senders, error: sendersError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', senderIds)

        if (sendersError) {
          console.warn('⚠️ Error fetching senders:', sendersError)
        } else {
          sendersData = senders || []
        }
      }

      // Enrich messages with sender data
      const enrichedMessages = messagesData?.map(msg => ({
        ...msg,
        sender: sendersData.find(s => s.id === msg.sender_id) || {
          id: msg.sender_id,
          full_name: 'Unknown User',
          avatar_url: null
        }
      })) || []

      console.log('✅ Successfully fetched messages:', enrichedMessages.length)
      setMessages(enrichedMessages)
      
    } catch (error) {
      console.error('❌ Error fetching messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setMessagesLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      console.log('📤 Sending message...')
      
      const { error } = await supabase
        .from(TABLES.MESSAGES || 'messages')
        .insert([{
          sender_id: profile.id,
          recipient_id: selectedConversation.other_participant.id,
          application_id: selectedConversation.application_id,
          content: newMessage.trim()
        }])

      if (error) {
        console.error('❌ Error sending message:', error)
        throw error
      }

      console.log('✅ Message sent successfully')
      setNewMessage('')
      // Message will be added via real-time subscription
      
    } catch (error) {
      console.error('❌ Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations

    const term = searchTerm.toLowerCase()
    return conversations.filter(conv =>
      conv.other_participant?.full_name?.toLowerCase().includes(term) ||
      conv.application?.jobs?.title?.toLowerCase().includes(term) ||
      conv.content?.toLowerCase().includes(term)
    )
  }, [conversations, searchTerm])

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Messages - JobFinder</title>
      </Helmet>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-[700px] flex">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
            
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <ConversationsListSkeleton />
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center">
                <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No conversations</h3>
                <p className="text-xs text-gray-500">
                  {conversations.length === 0 
                    ? "Apply to jobs or respond to applications to start messaging."
                    : "No conversations match your search."
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.application_id}
                    conversation={conversation}
                    isSelected={selectedConversation?.application_id === conversation.application_id}
                    onClick={() => setSelectedConversation(conversation)}
                    currentUserId={profile.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedConversation.other_participant?.avatar_url ? (
                      <img
                        src={selectedConversation.other_participant.avatar_url}
                        alt={selectedConversation.other_participant.full_name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(selectedConversation.other_participant?.full_name || 'User')}`}>
                        {getInitials(selectedConversation.other_participant?.full_name || 'User')}
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {selectedConversation.other_participant?.full_name || 'Unknown User'}
                      </h3>
                      {selectedConversation.application?.jobs && (
                        <p className="text-sm text-gray-500 flex items-center">
                          <BriefcaseIcon className="h-3 w-3 mr-1" />
                          {selectedConversation.application.jobs.title}
                        </p>
                      )}
                    </div>
                  </div>

                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <MessagesListSkeleton />
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwnMessage={message.sender_id === profile.id}
                        showAvatar={
                          index === 0 || 
                          messages[index - 1].sender_id !== message.sender_id
                        }
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-end space-x-3">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <PaperClipIcon className="h-5 w-5" />
                  </button>
                  
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      style={{ minHeight: '40px', maxHeight: '120px' }}
                    />
                  </div>
                  
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose a conversation from the list to start messaging.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConversationItem({ conversation, isSelected, onClick, currentUserId }) {
  const isFromCurrentUser = conversation.sender_id === currentUserId
  
  return (
    <motion.div
      whileHover={{ backgroundColor: '#f9fafb' }}
      onClick={onClick}
      className={`p-4 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-r-2 border-blue-600' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start space-x-3">
        {conversation.other_participant?.avatar_url ? (
          <img
            src={conversation.other_participant.avatar_url}
            alt={conversation.other_participant.full_name}
            className="h-12 w-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${getAvatarColor(conversation.other_participant?.full_name || 'User')}`}>
            {getInitials(conversation.other_participant?.full_name || 'User')}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {conversation.other_participant?.full_name || 'Unknown User'}
            </h4>
            <span className="text-xs text-gray-500">
              {timeAgo(conversation.last_message_time)}
            </span>
          </div>
          
          {conversation.application?.jobs && (
            <p className="text-xs text-gray-500 mb-1 flex items-center">
              <BriefcaseIcon className="h-3 w-3 mr-1" />
              {conversation.application.jobs.title}
            </p>
          )}
          
          <p className="text-sm text-gray-600 truncate">
            {isFromCurrentUser && <span className="text-gray-400">You: </span>}
            {conversation.last_message}
          </p>
          
          {conversation.unread_count > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                {conversation.unread_count}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function MessageBubble({ message, isOwnMessage, showAvatar }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'}`}
    >
      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {!isOwnMessage && showAvatar && (
          message.sender?.avatar_url ? (
            <img
              src={message.sender.avatar_url}
              alt={message.sender.full_name}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-xs ${getAvatarColor(message.sender?.full_name || 'User')}`}>
              {getInitials(message.sender?.full_name || 'User').charAt(0)}
            </div>
          )
        )}
        
        <div className={`px-4 py-2 rounded-lg ${
          isOwnMessage 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatDate(message.created_at, { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isOwnMessage && (
              <CheckIcon className="h-3 w-3 text-blue-100 ml-2" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ConversationsListSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function MessagesListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} animate-pulse`}>
          <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-100'}`}>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}