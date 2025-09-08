// src/pages/admin/Jobs.jsx - Enhanced version with full functionality
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams, Link } from 'react-router-dom'
import {
  BriefcaseIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  CalendarDaysIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PhotoIcon,
  PlayIcon,
  PauseIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

import { useAuth } from '../../contexts/AuthContext'
import { supabase, TABLES, USER_ROLES } from '../../lib/supabase'
import { formatSalary, formatDate, timeAgo } from '../../lib/utils'
import { JOB_CATEGORIES } from '../../lib/constants'

const JOB_STATUSES = {
  'all': 'All Jobs',
  'active': 'Active',
  'pending_approval': 'Pending Approval',
  'rejected': 'Rejected',
  'expired': 'Expired',
  'draft': 'Draft'
}

export default function AdminJobs() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(new Set())
  const [jobs, setJobs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('filter') || 'all')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedJobs, setSelectedJobs] = useState(new Set())
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    rejected: 0,
    expired: 0,
    draft: 0
  })

  useEffect(() => {
    if (profile?.role === USER_ROLES.ADMIN) {
      fetchJobs()
    }
  }, [profile, selectedStatus, selectedCategory])

  // Update URL when filter changes
  useEffect(() => {
    if (selectedStatus !== 'all') {
      setSearchParams({ filter: selectedStatus })
    } else {
      setSearchParams({})
    }
  }, [selectedStatus, setSearchParams])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching jobs for admin...')

      // Build query
      let query = supabase
        .from(TABLES.JOBS)
        .select(`
          *,
          employer_profiles!jobs_employer_id_fkey (
            user_id,
            company_name,
            company_logo_url,
            industry,
            company_description,
            company_size,
            website_url
          ),
          approved_by_profile:profiles!jobs_approved_by_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      // Apply status filter
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      // Apply category filter
      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching jobs:', error)
        throw error
      }

      console.log(`✅ Fetched ${data?.length || 0} jobs`)
      setJobs(data || [])

      // Calculate stats
      const now = new Date()
      const jobStats = (data || []).reduce((acc, job) => {
        acc.total++
        if (job.status === 'active') acc.active++
        else if (job.status === 'pending_approval') acc.pending++
        else if (job.status === 'rejected') acc.rejected++
        else if (job.status === 'draft') acc.draft++
        
        // Check if expired
        if (job.expires_at && new Date(job.expires_at) < now) {
          acc.expired++
        }
        
        return acc
      }, { total: 0, active: 0, pending: 0, rejected: 0, expired: 0, draft: 0 })

      setStats(jobStats)

    } catch (error) {
      console.error('❌ Error fetching jobs:', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = useMemo(() => {
    let filtered = jobs

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(term) ||
        job.description?.toLowerCase().includes(term) ||
        job.employer_profiles?.company_name?.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term) ||
        job.category?.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [jobs, searchTerm])

  const handleJobAction = async (jobId, action, rejectionReason = null) => {
    try {
      setProcessing(prev => new Set([...prev, jobId]))
      console.log(`🔄 ${action}ing job ${jobId}...`)

      const updates = {
        status: action,
        updated_at: new Date().toISOString()
      }

      // Add specific fields based on action
      if (action === 'active') {
        updates.approved_at = new Date().toISOString()
        updates.approved_by = profile.id
        updates.rejection_reason = null
      } else if (action === 'rejected') {
        updates.rejection_reason = rejectionReason || 'No reason provided'
        updates.approved_at = null
        updates.approved_by = null
      } else if (action === 'pending_approval') {
        updates.approved_at = null
        updates.approved_by = null
        updates.rejection_reason = null
      }

      const { error } = await supabase
        .from(TABLES.JOBS)
        .update(updates)
        .eq('id', jobId)

      if (error) throw error

      // Update local state
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId 
            ? { 
                ...job, 
                ...updates,
                approved_by_profile: action === 'active' ? [{ full_name: profile.full_name }] : null
              }
            : job
        )
      )

      // Update stats
      setStats(prevStats => {
        const newStats = { ...prevStats }
        const job = jobs.find(j => j.id === jobId)
        
        if (job) {
          // Remove from old status
          if (job.status === 'pending_approval') newStats.pending--
          else if (job.status === 'active') newStats.active--
          else if (job.status === 'rejected') newStats.rejected--
          else if (job.status === 'draft') newStats.draft--

          // Add to new status
          if (action === 'active') newStats.active++
          else if (action === 'rejected') newStats.rejected++
          else if (action === 'pending_approval') newStats.pending++
          else if (action === 'draft') newStats.draft++
        }

        return newStats
      })

      toast.success(
        action === 'active' 
          ? 'Job approved and published successfully!' 
          : action === 'rejected'
          ? 'Job rejected'
          : action === 'pending_approval'
          ? 'Job moved to pending review'
          : 'Job updated'
      )

      console.log(`✅ Job ${action}ed successfully`)

    } catch (error) {
      console.error(`❌ Error ${action}ing job:`, error)
      toast.error(`Failed to ${action} job: ${error.message}`)
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedJobs.size === 0) {
      toast.error('Please select jobs first')
      return
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedJobs.size} job(s)?`)) {
      return
    }

    try {
      setLoading(true)
      const promises = Array.from(selectedJobs).map(jobId => 
        handleJobAction(jobId, action)
      )
      
      await Promise.all(promises)
      setSelectedJobs(new Set())
      toast.success(`${selectedJobs.size} jobs ${action}ed successfully`)
    } catch (error) {
      toast.error(`Failed to ${action} selected jobs`)
    } finally {
      setLoading(false)
    }
  }

  const toggleJobSelection = (jobId) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }

  const selectAllJobs = () => {
    if (selectedJobs.size === filteredJobs.length) {
      setSelectedJobs(new Set())
    } else {
      setSelectedJobs(new Set(filteredJobs.map(job => job.id)))
    }
  }

  if (loading && jobs.length === 0) {
    return <AdminJobsSkeleton />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Manage Jobs - Admin Dashboard</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
          <p className="mt-2 text-gray-600">
            Review and approve job postings from employers
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/admin/dashboard"
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Jobs</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          <div className="text-sm text-gray-600">Draft</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.expired}</div>
          <div className="text-sm text-gray-600">Expired</div>
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
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(JOB_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {JOB_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedJobs.size > 0 && (
            <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-sm text-blue-800">
                  {selectedJobs.size} job{selectedJobs.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('active')}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Approve All
                </button>
                <button
                  onClick={() => handleBulkAction('rejected')}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Reject All
                </button>
                <button
                  onClick={() => handleBulkAction('pending_approval')}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                >
                  Mark Pending
                </button>
                <button
                  onClick={() => setSelectedJobs(new Set())}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
              onChange={selectAllJobs}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm font-medium text-gray-900">
              Select All ({filteredJobs.length})
            </span>
          </div>
        </div>

        {/* Jobs */}
        <div className="divide-y divide-gray-200">
          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center">
              <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria' : 'No jobs match the current filters'}
              </p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                isSelected={selectedJobs.has(job.id)}
                onToggleSelect={() => toggleJobSelection(job.id)}
                onAction={handleJobAction}
                isProcessing={processing.has(job.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function JobRow({ job, isSelected, onToggleSelect, onAction, isProcessing }) {
  const [showDetails, setShowDetails] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    onAction(job.id, 'rejected', rejectionReason)
    setShowRejectModal(false)
    setRejectionReason('')
  }

  const getStatusBadge = (status) => {
    const badges = {
      'active': 'bg-green-100 text-green-800',
      'pending_approval': 'bg-yellow-100 text-yellow-800',
      'rejected': 'bg-red-100 text-red-800',
      'draft': 'bg-gray-100 text-gray-800',
      'expired': 'bg-gray-100 text-gray-800'
    }
    
    const labels = {
      'active': 'Active',
      'pending_approval': 'Pending',
      'rejected': 'Rejected',
      'draft': 'Draft',
      'expired': 'Expired'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status] || badges.draft}`}>
        {labels[status] || status}
      </span>
    )
  }

  // Get media for display
  const allMedia = []
  if (job.media_urls?.length > 0) {
    job.media_urls.forEach(url => {
      const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url)
      allMedia.push({ type: isVideo ? 'video' : 'image', url })
    })
  }
  if (job.workplace_images?.length > 0) {
    job.workplace_images.forEach(url => {
      allMedia.push({ type: 'image', url })
    })
  }

  const currentMedia = allMedia[currentMediaIndex]

  return (
    <>
      <div className="p-6 hover:bg-gray-50">
        <div className="flex items-start">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          
          <div className="ml-4 flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                  {getStatusBadge(job.status)}
                  {job.is_featured && (
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                      Featured
                    </span>
                  )}
                  {job.category && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {job.category}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                    <span>{job.employer_profiles?.company_name || 'Unknown Company'}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span>{job.location || 'Remote'}</span>
                  </div>
                  {(job.salary_min || job.salary_max) && (
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                      <span>{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-1" />
                    <span>{timeAgo(job.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                  <span>Views: {job.views_count || 0}</span>
                  <span>Applications: {job.applications_count || 0}</span>
                  {job.expires_at && (
                    <span>Expires: {formatDate(job.expires_at)}</span>
                  )}
                  {job.approved_by_profile?.[0] && (
                    <span>Approved by: {job.approved_by_profile[0].full_name}</span>
                  )}
                </div>

                {/* Media preview */}
                {allMedia.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <PhotoIcon className="h-4 w-4" />
                    <span>{allMedia.length} media file{allMedia.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="View details"
                >
                  {showDetails ? (
                    <ChevronUpIcon className="h-5 w-5" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5" />
                  )}
                </button>

                {job.status === 'pending_approval' && (
                  <>
                    <button
                      onClick={() => onAction(job.id, 'active')}
                      disabled={isProcessing}
                      className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={isProcessing}
                      className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </>
                )}

                {job.status === 'rejected' && (
                  <button
                    onClick={() => onAction(job.id, 'pending_approval')}
                    disabled={isProcessing}
                    className="flex items-center px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Review Again
                  </button>
                )}

                {job.status === 'active' && (
                  <button
                    onClick={() => onAction(job.id, 'rejected', 'Suspended by admin')}
                    disabled={isProcessing}
                    className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Suspend
                  </button>
                )}

                {job.status === 'draft' && (
                  <button
                    onClick={() => onAction(job.id, 'pending_approval')}
                    disabled={isProcessing}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Review
                  </button>
                )}
              </div>
            </div>

            {/* Job Details */}
            {showDetails && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-700">{job.description}</p>
                    </div>
                    
                    {/* Requirements */}
                    {job.requirements?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                          {job.requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Skills */}
                    {job.skills_required?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Skills Required</h4>
                        <div className="flex flex-wrap gap-1">
                          {job.skills_required.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Benefits */}
                    {job.benefits?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Benefits</h4>
                        <div className="flex flex-wrap gap-1">
                          {job.benefits.map((benefit, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Media */}
                    {allMedia.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Job Media ({allMedia.length})</h4>
                        <div className="relative">
                          {currentMedia && (
                            <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                              {currentMedia.type === 'video' ? (
                                <video
                                  className="w-full h-full object-cover"
                                  controls
                                  preload="metadata"
                                >
                                  <source src={currentMedia.url} type="video/mp4" />
                                </video>
                              ) : (
                                <img
                                  src={currentMedia.url}
                                  alt="Job media"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                  }}
                                />
                              )}
                            </div>
                          )}
                          
                          {allMedia.length > 1 && (
                            <div className="mt-2 flex space-x-1">
                              {allMedia.map((media, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentMediaIndex(index)}
                                  className={`w-12 h-12 rounded border-2 overflow-hidden ${
                                    index === currentMediaIndex ? 'border-blue-500' : 'border-gray-300'
                                  }`}
                                >
                                  {media.type === 'video' ? (
                                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                      <PlayIcon className="h-4 w-4 text-gray-600" />
                                    </div>
                                  ) : (
                                    <img
                                      src={media.url}
                                      alt={`Media ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Company Info */}
                    {job.employer_profiles && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Company Information</h4>
                        <div className="text-sm space-y-1">
                          <p><strong>Name:</strong> {job.employer_profiles.company_name}</p>
                          {job.employer_profiles.industry && (
                            <p><strong>Industry:</strong> {job.employer_profiles.industry}</p>
                          )}
                          {job.employer_profiles.company_size && (
                            <p><strong>Size:</strong> {job.employer_profiles.company_size}</p>
                          )}
                          {job.employer_profiles.website_url && (
                            <p>
                              <strong>Website:</strong>{' '}
                              <a 
                                href={job.employer_profiles.website_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {job.employer_profiles.website_url}
                              </a>
                            </p>
                          )}
                          {job.employer_profiles.company_description && (
                            <p><strong>Description:</strong> {job.employer_profiles.company_description}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Reason */}
                {job.rejection_reason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <h4 className="font-medium text-red-900 mb-1">Rejection Reason</h4>
                    <p className="text-sm text-red-700">{job.rejection_reason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Job</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this job posting. This will be sent to the employer.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows={3}
              placeholder="Enter rejection reason..."
              required
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject Job
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AdminJobsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="flex space-x-3">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="h-6 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="border-b border-gray-200 pb-4">
                <div className="flex items-start">
                  <div className="h-4 w-4 bg-gray-200 rounded mt-1 mr-4"></div>
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
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
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