
// src/hooks/useAdminUsers.js
import { useState } from 'react'
import { supabase, TABLES } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useAdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })

  const fetchUsers = async (filters = {}) => {
    try {
      setLoading(true)
      
      let query = supabase
        .from(TABLES.PROFILES)
        .select(`
          *,
          job_seeker_profiles(*),
          employer_profiles(*),
          institution_partners(*),
          subscriptions(tier, expires_at)
        `, { count: 'exact' })

      // Apply filters
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }
      if (filters.role) {
        query = query.eq('role', filters.role)
      }
      if (filters.status) {
        query = query.eq('is_active', filters.status === 'active')
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit - 1)

      if (error) throw error

      setUsers(data || [])
      setPagination(prev => ({ ...prev, total: count || 0 }))
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userId, updates) => {
    try {
      const { error } = await supabase
        .from(TABLES.PROFILES)
        .update(updates)
        .eq('id', userId)

      if (error) throw error
      toast.success('User updated successfully')
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    }
  }

  const suspendUser = async (userId, reason) => {
    try {
      const { error } = await supabase
        .from(TABLES.PROFILES)
        .update({ 
          is_active: false,
          suspension_reason: reason,
          suspended_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error
      toast.success('User suspended successfully')
    } catch (error) {
      console.error('Error suspending user:', error)
      toast.error('Failed to suspend user')
    }
  }

  const verifyUser = async (userId) => {
    try {
      const { error } = await supabase
        .from(TABLES.PROFILES)
        .update({ 
          is_verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error
      toast.success('User verified successfully')
    } catch (error) {
      console.error('Error verifying user:', error)
      toast.error('Failed to verify user')
    }
  }

  const deleteUser = async (userId) => {
    try {
      const { error } = await supabase
        .from(TABLES.PROFILES)
        .delete()
        .eq('id', userId)

      if (error) throw error
      toast.success('User deleted successfully')
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const bulkAction = async (action, userIds, data = {}) => {
    try {
      let updates = {}
      
      switch (action) {
        case 'suspend':
          updates = { 
            is_active: false, 
            suspension_reason: data.reason,
            suspended_at: new Date().toISOString()
          }
          break
        case 'activate':
          updates = { is_active: true, suspension_reason: null, suspended_at: null }
          break
        case 'verify':
          updates = { is_verified: true, verified_at: new Date().toISOString() }
          break
        case 'delete':
          const { error: deleteError } = await supabase
            .from(TABLES.PROFILES)
            .delete()
            .in('id', userIds)
          
          if (deleteError) throw deleteError
          toast.success(`${userIds.length} users deleted successfully`)
          return
      }

      const { error } = await supabase
        .from(TABLES.PROFILES)
        .update(updates)
        .in('id', userIds)

      if (error) throw error
      toast.success(`Bulk action completed for ${userIds.length} users`)
    } catch (error) {
      console.error('Error performing bulk action:', error)
      toast.error('Failed to perform bulk action')
    }
  }

  return {
    users,
    loading,
    pagination,
    fetchUsers,
    updateUser,
    suspendUser,
    verifyUser,
    deleteUser,
    bulkAction
  }
}
