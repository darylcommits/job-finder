
// src/hooks/useNotifications.js
import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase, TABLES } from '../lib/supabase'
import { useRealtime } from './useRealtime'

export function useNotifications() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!profile?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      )
      
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    if (!profile?.id) return

    try {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', profile.id)
        .eq('is_read', false)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      )
      
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Listen for new notifications
  useRealtime(
    TABLES.NOTIFICATIONS,
    (payload) => {
      if (payload.eventType === 'INSERT' && payload.new.user_id === profile?.id) {
        setNotifications(prev => [payload.new, ...prev])
        setUnreadCount(prev => prev + 1)
      }
      
      if (payload.eventType === 'UPDATE' && payload.new.user_id === profile?.id) {
        setNotifications(prev =>
          prev.map(n => n.id === payload.new.id ? payload.new : n)
        )
      }
      
      if (payload.eventType === 'DELETE') {
        setNotifications(prev => prev.filter(n => n.id !== payload.old.id))
      }
    },
    { filter: `user_id=eq.${profile?.id}` }
  )

  useEffect(() => {
    fetchNotifications()
  }, [profile?.id])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications
  }
}