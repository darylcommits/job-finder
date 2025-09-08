// src/pages/admin/AdminUsers.jsx - Complete Admin Users Management
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams } from 'react-router-dom'
import {
  UsersIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  CalendarDaysIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  UserIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

import { useAuth } from '../../contexts/AuthContext'
import { supabase, TABLES, USER_ROLES, handleSupabaseError } from '../../lib/supabase'
import { formatDate, timeAgo } from '../../lib/utils'

const USER_FILTERS = {
  'all': 'All Users',
  'job_seeker': 'Job Seekers',
  'employer': 'Employers',
  'institution_partner': 'Institution Partners',
  'admin': 'Admins',
  'verified': 'Verified Users',
  'unverified': 'Unverified Users',
  'active': 'Active Users',
  'inactive': 'Inactive Users'
}

export default function AdminUsers() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(new Set())
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState(searchParams.get('filter') || 'all')
  const [selectedUsers, setSelectedUsers] = useState(new Set())
  const [expandedUser, setExpandedUser] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    job_seekers: 0,
    employers: 0,
    institution_partners: 0,
    verified: 0,
    active: 0
  })

  useEffect(() => {
    if (profile?.role === USER_ROLES.ADMIN) {
      fetchUsers()
    }
  }, [profile, selectedFilter])

  useEffect(() => {
    if (selectedFilter !== 'all') {
      setSearchParams({ filter: selectedFilter })
    } else {
      setSearchParams({})
    }
  }, [selectedFilter, setSearchParams])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching users for admin...')

      const { data: profilesData, error: profilesError } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        throw profilesError
      }

      console.log(`✅ Fetched ${profilesData?.length || 0} users`)
      setUsers(profilesData || [])

      // Calculate stats
      const userStats = (profilesData || []).reduce((acc, user) => {
        acc.total++
        if (user.role === USER_ROLES.JOB_SEEKER) acc.job_seekers++
        else if (user.role === USER_ROLES.EMPLOYER) acc.employers++
        else if (user.role === USER_ROLES.INSTITUTION_PARTNER) acc.institution_partners++
        
        if (user.is_verified) acc.verified++
        if (user.is_active) acc.active++
        
        return acc
      }, { total: 0, job_seekers: 0, employers: 0, institution_partners: 0, verified: 0, active: 0 })

      setStats(userStats)

    } catch (error) {
      console.error('❌ Error fetching users:', error)
      toast.error(`Failed to load users: ${handleSupabaseError(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    let filtered = users

    if (selectedFilter !== 'all') {
      switch (selectedFilter) {
        case 'job_seeker':
        case 'employer':
        case 'institution_partner':
        case 'admin':
          filtered = filtered.filter(user => user.role === selectedFilter)
          break
        case 'verified':
          filtered = filtered.filter(user => user.is_verified)
          break
        case 'unverified':
          filtered = filtered.filter(user => !user.is_verified)
          break
        case 'active':
          filtered = filtered.filter(user => user.is_active)
          break
        case 'inactive':
          filtered = filtered.filter(user => !user.is_active)
          break
      }
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone?.toLowerCase().includes(term) ||
        user.location?.toLowerCase().includes(term) ||
        user.headline?.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [users, selectedFilter, searchTerm])

  const handleUserAction = async (userId, action, reason = null) => {
    // Confirm destructive actions
    if (action === 'deactivate' || action === 'demote_admin') {
      const confirmMessage = action === 'deactivate' 
        ? 'Are you sure you want to deactivate this user?' 
        : 'Are you sure you want to remove admin privileges from this user?'
      
      if (!window.confirm(confirmMessage)) {
        return
      }
    }

    try {
      setProcessing(prev => new Set([...prev, userId]))
      console.log(`🔄 ${action}ing user ${userId}...`)

      let updates = {
        updated_at: new Date().toISOString()
      }
      
      switch (action) {
        case 'verify':
          updates.is_verified = true
          break
        case 'unverify':
          updates.is_verified = false
          break
        case 'activate':
          updates.is_active = true
          break
        case 'deactivate':
          updates.is_active = false
          break
        case 'promote_admin':
          updates.role = USER_ROLES.ADMIN
          updates.is_verified = true // Admins should be verified
          break
        case 'demote_admin':
          updates.role = USER_ROLES.JOB_SEEKER
          break
        default:
          throw new Error(`Unknown action: ${action}`)
      }

      const { error } = await supabase
        .from(TABLES.PROFILES)
        .update(updates)
        .eq('id', userId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, ...updates }
            : user
        )
      )

      // Refresh stats
      await fetchUsers()

      const messages = {
        verify: 'User verified successfully!',
        unverify: 'User verification removed',
        activate: 'User activated successfully',
        deactivate: 'User deactivated',
        promote_admin: 'User promoted to admin successfully',
        demote_admin: 'Admin privileges removed'
      }

      toast.success(messages[action] || 'User updated successfully')
      console.log(`✅ User ${action}ed successfully`)

    } catch (error) {
      console.error(`❌ Error ${action}ing user:`, error)
      toast.error(`Failed to ${action} user: ${handleSupabaseError(error)}`)
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedUsers.size === 0) {
      toast.error('Please select users first')
      return
    }

    const confirmMessage = `Are you sure you want to ${action} ${selectedUsers.size} user(s)?`
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setLoading(true)
      console.log(`🔄 Bulk ${action}ing ${selectedUsers.size} users...`)

      // Process users in batches to avoid overwhelming the database
      const userIds = Array.from(selectedUsers)
      const batchSize = 10
      const batches = []
      
      for (let i = 0; i < userIds.length; i += batchSize) {
        batches.push(userIds.slice(i, i + batchSize))
      }

      for (const batch of batches) {
        const promises = batch.map(userId => handleUserAction(userId, action))
        await Promise.all(promises)
      }

      setSelectedUsers(new Set())
      toast.success(`${selectedUsers.size} users ${action}ed successfully`)
      
    } catch (error) {
      console.error(`❌ Error in bulk ${action}:`, error)
      toast.error(`Failed to ${action} selected users`)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const selectAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)))
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case USER_ROLES.JOB_SEEKER:
        return UserIcon
      case USER_ROLES.EMPLOYER:
        return BuildingOfficeIcon
      case USER_ROLES.INSTITUTION_PARTNER:
        return AcademicCapIcon
      case USER_ROLES.ADMIN:
        return ShieldCheckIcon
      default:
        return UserIcon
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case USER_ROLES.JOB_SEEKER:
        return 'text-blue-600 bg-blue-100'
      case USER_ROLES.EMPLOYER:
        return 'text-green-600 bg-green-100'
      case USER_ROLES.INSTITUTION_PARTNER:
        return 'text-purple-600 bg-purple-100'
      case USER_ROLES.ADMIN:
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading && users.length === 0) {
    return <AdminUsersSkeleton />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Manage Users - Admin Dashboard</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage platform users
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          ) : (
            <UsersIcon className="h-5 w-5 mr-2" />
          )}
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.job_seekers}</div>
          <div className="text-sm text-gray-600">Job Seekers</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.employers}</div>
          <div className="text-sm text-gray-600">Employers</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.institution_partners}</div>
          <div className="text-sm text-gray-600">Institutions</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.verified}</div>
          <div className="text-sm text-gray-600">Verified</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(USER_FILTERS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-sm text-blue-800">
                  {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('verify')}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Verify All
                </button>
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Activate All
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Deactivate All
                </button>
                <button
                  onClick={() => setSelectedUsers(new Set())}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
              onChange={selectAllUsers}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm font-medium text-gray-900">
              Select All ({filteredUsers.length})
            </span>
          </div>
        </div>

        {/* Users */}
        <div className="divide-y divide-gray-200">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria' : 'No users match the current filters'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={profile?.id}
                isSelected={selectedUsers.has(user.id)}
                onToggleSelect={() => toggleUserSelection(user.id)}
                onAction={handleUserAction}
                isProcessing={processing.has(user.id)}
                isExpanded={expandedUser === user.id}
                onToggleExpand={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                getRoleIcon={getRoleIcon}
                getRoleColor={getRoleColor}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function UserRow({ 
  user, 
  currentUserId,
  isSelected, 
  onToggleSelect, 
  onAction, 
  isProcessing, 
  isExpanded, 
  onToggleExpand,
  getRoleIcon,
  getRoleColor
}) {
  const RoleIcon = getRoleIcon(user.role)
  const roleColor = getRoleColor(user.role)
  const isCurrentUser = user.id === currentUserId

  const getDisplayName = () => {
    return user.full_name || 'Unknown User'
  }

  const getSubtitle = () => {
    return user.email
  }

  return (
    <div className="p-6 hover:bg-gray-50">
      <div className="flex items-start">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          disabled={isCurrentUser}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1 disabled:opacity-50"
        />
        
        <div className="ml-4 flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {getDisplayName()}
                  {isCurrentUser && (
                    <span className="ml-2 text-sm text-blue-600">(You)</span>
                  )}
                </h3>
                
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${roleColor}`}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>

                {user.is_verified ? (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    <ShieldCheckIcon className="h-3 w-3 mr-1" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    <ShieldExclamationIcon className="h-3 w-3 mr-1" />
                    Unverified
                  </span>
                )}

                {!user.is_active && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{getSubtitle()}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                  <span>Joined {timeAgo(user.created_at)}</span>
                </div>
                {user.location && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.last_active && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Active {timeAgo(user.last_active)}</span>
                  </div>
                )}
                <span>Profile: {user.profile_completion || 0}%</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onToggleExpand}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title={isExpanded ? "Hide details" : "Show details"}
              >
                {isExpanded ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>

              {!user.is_verified && !isCurrentUser && (
                <button
                  onClick={() => onAction(user.id, 'verify')}
                  disabled={isProcessing}
                  className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Verify
                </button>
              )}

              {user.is_verified && user.role !== USER_ROLES.ADMIN && !isCurrentUser && (
                <button
                  onClick={() => onAction(user.id, 'unverify')}
                  disabled={isProcessing}
                  className="flex items-center px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Unverify
                </button>
              )}

              {user.is_active && !isCurrentUser ? (
                <button
                  onClick={() => onAction(user.id, 'deactivate')}
                  disabled={isProcessing || user.role === USER_ROLES.ADMIN}
                  className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Deactivate
                </button>
              ) : !isCurrentUser && (
                <button
                  onClick={() => onAction(user.id, 'activate')}
                  disabled={isProcessing}
                  className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Activate
                </button>
              )}

              {user.role !== USER_ROLES.ADMIN && !isCurrentUser && (
                <button
                  onClick={() => onAction(user.id, 'promote_admin')}
                  disabled={isProcessing}
                  className="flex items-center px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  <ShieldCheckIcon className="h-4 w-4 mr-1" />
                  Make Admin
                </button>
              )}

              {user.role === USER_ROLES.ADMIN && !isCurrentUser && (
                <button
                  onClick={() => onAction(user.id, 'demote_admin')}
                  disabled={isProcessing}
                  className="flex items-center px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Remove Admin
                </button>
              )}
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Contact Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.location && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{user.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Stats */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Account Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Created:</strong> {formatDate(user.created_at)}</p>
                    <p><strong>Last Active:</strong> {user.last_active ? formatDate(user.last_active) : 'Never'}</p>
                    <p><strong>Profile Completion:</strong> {user.profile_completion || 0}%</p>
                    <p><strong>Anonymous Mode:</strong> {user.anonymous_mode ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>

                {/* Profile Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Profile Information</h4>
                  <div className="space-y-2 text-sm">
                    {user.headline && <p><strong>Headline:</strong> {user.headline}</p>}
                    {user.avatar_url && (
                      <div>
                        <strong>Avatar:</strong>
                        <img src={user.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full mt-1" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {user.bio && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                  <p className="text-sm text-gray-700">{user.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AdminUsersSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="h-6 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-6">
                <div className="flex items-start">
                  <div className="h-4 w-4 bg-gray-200 rounded mt-1"></div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded w-64 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="flex space-x-4">
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}