// src/hooks/useMessages.js
import { useState, useEffect, useCallback } from 'react'
import { supabase, TABLES } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useMessages() {
  const { profile } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchConversations = useCallback(async () => {
    if (!profile?.id) {
      setConversations([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Get all conversations where user is either sender or recipient
      const { data, error } = await supabase
        .from(TABLES.MESSAGES || 'messages')
        .select(`
          conversation_id,
          sender_id,
          recipient_id,
          job_id,
          application_id,
          content,
          created_at,
          jobs (
            id,
            title,
            employer_id
          ),
          applications (
            id,
            status,
            applicant_id
          ),
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name,
            avatar_url,
            email
          ),
          recipient:profiles!messages_recipient_id_fkey (
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group messages by conversation and get the latest message for each
      const conversationMap = new Map()
      
      data?.forEach(message => {
        const existing = conversationMap.get(message.conversation_id)
        if (!existing || new Date(message.created_at) > new Date(existing.created_at)) {
          // Determine the other participant
          const otherParticipant = message.sender_id === profile.id 
            ? message.recipient 
            : message.sender
          
          conversationMap.set(message.conversation_id, {
            ...message,
            other_participant: otherParticipant,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: 0 // TODO: Implement unread count logic
          })
        }
      })

      const conversationsList = Array.from(conversationMap.values())
      setConversations(conversationsList)
      
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!profile?.id) return

    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${profile.id},recipient_id.eq.${profile.id})`
        },
        () => {
          // Refresh conversations when new message arrives
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [profile?.id, fetchConversations])

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations
  }
}

export function useConversationMessages(conversationId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from(TABLES.MESSAGES || 'messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
      
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Set up real-time subscription for this conversation
  useEffect(() => {
    if (!conversationId) return

    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [conversationId])

  const sendMessage = useCallback(async (content, senderId, recipientId, jobId, applicationId) => {
    if (!content.trim() || !conversationId) return false

    try {
      const { error } = await supabase
        .from(TABLES.MESSAGES || 'messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: recipientId,
          job_id: jobId,
          application_id: applicationId,
          content: content.trim(),
          type: 'text'
        }])

      if (error) throw error
      return true
      
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err.message)
      return false
    }
  }, [conversationId])

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: fetchMessages
  }
}