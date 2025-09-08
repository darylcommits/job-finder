// src/pages/admin/Reports.jsx - Enhanced with real data fetching
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  BriefcaseIcon,
  ChatBubbleLeftIcon,
  ShieldExclamationIcon,
  FlagIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

import { useAuth } from '../../contexts/AuthContext'
import { supabase, TABLES, USER_ROLES } from '../../lib/supabase'
import { formatDate, timeAgo } from '../../lib/utils'

const REPORT_TYPES = {
  'all': 'All Reports',
  'user': 'User Reports',
  'job': 'Job Reports',
  'message': 'Message Reports',
  'review': 'Review Reports'
}

const REPORT_CATEGORIES = {
  'all': 'All Categories',
  'spam': 'Spam',
  'harassment': 'Harassment',
  'inappropriate': 'Inappropriate Content',
  'fake': 'Fake Information',
  'scam': 'Scam',
  'violence': 'Violence/Threats',
  'other': 'Other'
}

const REPORT_STATUSES = {
  'all': 'All Statuses',
  'pending': 'Pending Review',
  'investigating': 'Under Investigation',
  'resolved': 'Resolved',
  'dismissed': 'Dismissed'
}

const PRIORITY_LEVELS = {
  'low': { label: 'Low', color: 'text-green-600 bg-green-100' },
  'medium': { label: 'Medium', color: 'text-yellow-600 bg-yellow-100' },
  'high': { label: 'High', color: 'text-red-600 bg-red-100' },
  'critical': { label: 'Critical', color: 'text-purple-600 bg-purple-100' }
}

export default function AdminReports() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(new Set())
  const [reports, setReports] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all')
  const [selectedReports, setSelectedReports] = useState(new Set())
  const [expandedReport, setExpandedReport] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    investigating: 0,
    resolved: 0,
    dismissed: 0,
    critical: 0
  })

  useEffect(() => {
    if (profile?.role === USER_ROLES.ADMIN) {
      fetchReports()
    }
  }, [profile, selectedType, selectedCategory, selectedStatus])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedType !== 'all') params.set('type', selectedType)
    if (selectedCategory !== 'all') params.set('category', selectedCategory)
    if (selectedStatus !== 'all') params.set('status', selectedStatus)
    setSearchParams(params)
  }, [selectedType, selectedCategory, selectedStatus, setSearchParams])

  const fetchReports = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching reports from database...')

      let query = supabase
        .from(TABLES.REPORTS)
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey (
            id,
            full_name,
            email,
            avatar_url
          ),
          reviewer:profiles!reports_reviewed_by_fkey (
            id,
            full_name,
            email
          ),
          reported_user:profiles!reports_reported_id_fkey (
            id,
            full_name,
            email
          ),
          reported_job:jobs!reports_reported_id_fkey (
            id,
            title,
            status,
            employer_profiles!jobs_employer_id_fkey (
              company_name
            )
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (selectedType !== 'all') {
        query = query.eq('reported_type', selectedType)
      }

      if (selectedCategory !== 'all') {
        query = query.eq('report_type', selectedCategory)
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data, error } = await query

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      console.log(`✅ Fetched ${data?.length || 0} reports`)
      
      // Process the data to match our component structure
      const processedReports = (data || []).map(report => ({
        ...report,
        // Calculate priority based on report type and age
        priority: calculatePriority(report),
        // Format reported item details
        reported_item: getReportedItemInfo(report),
        // Format reporter info
        reported_by: {
          id: report.reporter?.id,
          name: report.reporter?.full_name || 'Unknown User',
          email: report.reporter?.email || 'No email',
          avatar_url: report.reporter?.avatar_url
        },
        // Format reviewer info
        assigned_to: report.reviewer ? {
          id: report.reviewer.id,
          name: report.reviewer.full_name || 'Unknown Admin'
        } : null,
        // Convert evidence URLs array to evidence objects
        evidence: (report.evidence_urls || []).map((url, index) => ({
          type: getEvidenceType(url),
          url: url,
          id: `evidence-${index}`
        }))
      }))

      setReports(processedReports)

      // Calculate stats
      calculateStats(processedReports)

    } catch (error) {
      console.error('❌ Error fetching reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const calculatePriority = (report) => {
    const now = new Date()
    const reportAge = now - new Date(report.created_at)
    const hoursOld = reportAge / (1000 * 60 * 60)

    // High priority conditions
    if (report.report_type === 'violence' || report.report_type === 'harassment') {
      return 'critical'
    }
    if (report.report_type === 'scam' || report.report_type === 'fake') {
      return 'high'
    }
    if (hoursOld > 72) { // Reports older than 3 days
      return 'high'
    }
    if (hoursOld > 24) { // Reports older than 1 day
      return 'medium'
    }
    return 'low'
  }

  const getReportedItemInfo = (report) => {
    switch (report.reported_type) {
      case 'user':
        return {
          id: report.reported_id,
          type: 'user',
          title: report.reported_user?.full_name || 'User Profile',
          subtitle: report.reported_user?.email || 'Unknown user'
        }
      case 'job':
        return {
          id: report.reported_id,
          type: 'job',
          title: report.reported_job?.title || 'Job Posting',
          subtitle: report.reported_job?.employer_profiles?.company_name || 'Unknown company'
        }
      case 'message':
        return {
          id: report.reported_id,
          type: 'message',
          title: 'Private Message',
          subtitle: 'Chat conversation'
        }
      case 'review':
        return {
          id: report.reported_id,
          type: 'review',
          title: 'Company Review',
          subtitle: 'User review'
        }
      default:
        return {
          id: report.reported_id,
          type: report.reported_type,
          title: 'Unknown Item',
          subtitle: 'Unknown type'
        }
    }
  }

  const getEvidenceType = (url) => {
    const extension = url.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image'
    }
    if (['mp4', 'mov', 'avi', 'wmv'].includes(extension)) {
      return 'video'
    }
    return 'file'
  }

  const calculateStats = (reportsData) => {
    const stats = reportsData.reduce((acc, report) => {
      acc.total++
      acc[report.status] = (acc[report.status] || 0) + 1
      if (report.priority === 'critical') {
        acc.critical++
      }
      return acc
    }, { 
      total: 0, 
      pending: 0, 
      investigating: 0, 
      resolved: 0, 
      dismissed: 0, 
      critical: 0 
    })

    setStats(stats)
  }

  const filteredReports = useMemo(() => {
    let filtered = reports

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(report =>
        report.description?.toLowerCase().includes(term) ||
        report.reported_by?.name?.toLowerCase().includes(term) ||
        report.reported_by?.email?.toLowerCase().includes(term) ||
        report.reported_item?.title?.toLowerCase().includes(term) ||
        report.resolution_notes?.toLowerCase().includes(term)
      )
    }

    // Sort by priority and creation date
    return filtered.sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [reports, searchTerm])

  const handleReportAction = async (reportId, action, notes = null) => {
    try {
      setProcessing(prev => new Set([...prev, reportId]))
      console.log(`🔄 ${action}ing report ${reportId}...`)

      let updates = {
        updated_at: new Date().toISOString()
      }
      
      switch (action) {
        case 'investigate':
          updates.status = 'investigating'
          updates.reviewed_by = profile.id
          break
        case 'resolve':
          updates.status = 'resolved'
          updates.reviewed_by = profile.id
          updates.reviewed_at = new Date().toISOString()
          updates.resolution_notes = notes || 'Report resolved'
          break
        case 'dismiss':
          updates.status = 'dismissed'
          updates.reviewed_by = profile.id
          updates.reviewed_at = new Date().toISOString()
          updates.resolution_notes = notes || 'Report dismissed'
          break
        case 'assign':
          updates.reviewed_by = profile.id
          break
        default:
          throw new Error(`Unknown action: ${action}`)
      }

      const { error } = await supabase
        .from(TABLES.REPORTS)
        .update(updates)
        .eq('id', reportId)

      if (error) throw error

      // Update local state
      setReports(prevReports => 
        prevReports.map(report => {
          if (report.id === reportId) {
            const updatedReport = { ...report, ...updates }
            
            // Update assigned_to if reviewed_by changed
            if (updates.reviewed_by) {
              updatedReport.assigned_to = {
                id: profile.id,
                name: profile.full_name || 'Admin'
              }
            }

            // Recalculate priority if status changed
            if (updates.status) {
              updatedReport.priority = calculatePriority(updatedReport)
            }

            return updatedReport
          }
          return report
        })
      )

      // Refresh stats
      const updatedReports = reports.map(report => 
        report.id === reportId ? { ...report, ...updates } : report
      )
      calculateStats(updatedReports)

      toast.success(
        action === 'investigate' ? 'Report assigned for investigation' :
        action === 'resolve' ? 'Report resolved successfully' :
        action === 'dismiss' ? 'Report dismissed' :
        action === 'assign' ? 'Report assigned to you' :
        'Report updated'
      )

      console.log(`✅ Report ${action}ed successfully`)

    } catch (error) {
      console.error(`❌ Error ${action}ing report:`, error)
      toast.error(`Failed to ${action} report`)
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev)
        newSet.delete(reportId)
        return newSet
      })
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedReports.size === 0) {
      toast.error('Please select reports first')
      return
    }

    try {
      setLoading(true)
      const promises = Array.from(selectedReports).map(reportId => 
        handleReportAction(reportId, action)
      )
      
      await Promise.all(promises)
      setSelectedReports(new Set())
      toast.success(`${selectedReports.size} reports ${action}ed successfully`)
    } catch (error) {
      toast.error(`Failed to ${action} selected reports`)
    } finally {
      setLoading(false)
    }
  }

  const toggleReportSelection = (reportId) => {
    setSelectedReports(prev => {
      const newSet = new Set(prev)
      if (newSet.has(reportId)) {
        newSet.delete(reportId)
      } else {
        newSet.add(reportId)
      }
      return newSet
    })
  }

  const selectAllReports = () => {
    if (selectedReports.size === filteredReports.length) {
      setSelectedReports(new Set())
    } else {
      setSelectedReports(new Set(filteredReports.map(report => report.id)))
    }
  }

  const getReportIcon = (type) => {
    switch (type) {
      case 'user':
        return UserIcon
      case 'job':
        return BriefcaseIcon
      case 'message':
        return ChatBubbleLeftIcon
      case 'review':
        return StarIcon
      default:
        return ExclamationTriangleIcon
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'spam':
        return FlagIcon
      case 'harassment':
        return ExclamationCircleIcon
      case 'inappropriate':
        return ShieldExclamationIcon
      case 'fake':
        return DocumentTextIcon
      case 'violence':
        return ExclamationTriangleIcon
      default:
        return FlagIcon
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'investigating': 'bg-blue-100 text-blue-800 border-blue-200',
      'resolved': 'bg-green-100 text-green-800 border-green-200',
      'dismissed': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    
    const labels = {
      'pending': 'Pending',
      'investigating': 'Investigating',
      'resolved': 'Resolved',
      'dismissed': 'Dismissed'
    }

    return (
      <motion.span 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`px-3 py-1 text-xs font-medium rounded-full border ${badges[status] || badges.pending}`}
      >
        {labels[status] || status}
      </motion.span>
    )
  }

  const refreshReports = async () => {
    setLoading(true)
    await fetchReports()
    toast.success('Reports refreshed!')
  }

  if (loading && reports.length === 0) {
    return <AdminReportsSkeleton />
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <Helmet>
        <title>Handle Reports - Admin Dashboard</title>
      </Helmet>

      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center"
            >
              <ShieldExclamationIcon className="h-6 w-6 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Handle Reports
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Review and resolve user reports to maintain platform safety
          </p>
        </div>
        <motion.button
          onClick={refreshReports}
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <motion.div
            animate={loading ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
          </motion.div>
          {loading ? 'Refreshing...' : 'Refresh'}
        </motion.button>
      </motion.div>

      {/* Enhanced Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8"
      >
        <StatCard title="Total Reports" value={stats.total} color="gray" delay={0} />
        <StatCard title="Pending" value={stats.pending} color="yellow" delay={0.1} highlight />
        <StatCard title="Investigating" value={stats.investigating} color="blue" delay={0.2} />
        <StatCard title="Resolved" value={stats.resolved} color="green" delay={0.3} />
        <StatCard title="Dismissed" value={stats.dismissed} color="gray" delay={0.4} />
        <StatCard title="Critical" value={stats.critical} color="red" delay={0.5} highlight />
      </motion.div>

      {/* Enhanced Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6"
      >
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                {Object.entries(REPORT_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                {Object.entries(REPORT_CATEGORIES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                {Object.entries(REPORT_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          <AnimatePresence>
            {selectedReports.size > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl"
              >
                <div className="flex items-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <SparklesIcon className="h-5 w-5 text-blue-600 mr-2" />
                  </motion.div>
                  <span className="text-sm font-medium text-blue-800">
                    {selectedReports.size} report{selectedReports.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex space-x-2">
                  <BulkActionButton onClick={() => handleBulkAction('investigate')} color="blue">
                    Investigate All
                  </BulkActionButton>
                  <BulkActionButton onClick={() => handleBulkAction('resolve')} color="green">
                    Resolve All
                  </BulkActionButton>
                  <BulkActionButton onClick={() => handleBulkAction('dismiss')} color="gray">
                    Dismiss All
                  </BulkActionButton>
                  <BulkActionButton onClick={() => setSelectedReports(new Set())} color="red">
                    Clear
                  </BulkActionButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Reports List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
      >
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedReports.size === filteredReports.length && filteredReports.length > 0}
              onChange={selectAllReports}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm font-semibold text-gray-900">
              Select All ({filteredReports.length})
            </span>
          </div>
        </div>

        {/* Reports */}
        <div className="divide-y divide-gray-100">
          <AnimatePresence>
            {filteredReports.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 text-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                </motion.div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search criteria' : 'No reports match the current filters'}
                </p>
              </motion.div>
            ) : (
              filteredReports.map((report, index) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  index={index}
                  isSelected={selectedReports.has(report.id)}
                  onToggleSelect={() => toggleReportSelection(report.id)}
                  onAction={handleReportAction}
                  isProcessing={processing.has(report.id)}
                  isExpanded={expandedReport === report.id}
                  onToggleExpand={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                  getReportIcon={getReportIcon}
                  getCategoryIcon={getCategoryIcon}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StatCard({ title, value, color, delay, highlight }) {
  const colorClasses = {
    gray: 'text-gray-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600'
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -2, scale: 1.02 }}
      className={`bg-white rounded-xl shadow-sm border-2 p-4 transition-all duration-200 ${
        highlight ? 'border-red-200 bg-gradient-to-br from-red-50 to-pink-50' : 'border-gray-200 hover:shadow-md'
      }`}
    >
      <motion.div 
        key={value}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`text-2xl font-bold ${colorClasses[color]}`}
      >
        {value}
      </motion.div>
      <div className={`text-sm ${highlight ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
        {title}
      </div>
    </motion.div>
  )
}

function BulkActionButton({ onClick, color, children }) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    gray: 'bg-gray-600 hover:bg-gray-700',
    red: 'bg-red-600 hover:bg-red-700'
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-4 py-2 text-white text-sm rounded-lg transition-colors ${colorClasses[color]}`}
    >
      {children}
    </motion.button>
  )
}

function ReportRow({ 
  report, 
  index,
  isSelected, 
  onToggleSelect, 
  onAction, 
  isProcessing, 
  isExpanded, 
  onToggleExpand,
  getReportIcon,
  getCategoryIcon,
  getStatusBadge
}) {
  const [notes, setNotes] = useState('')
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [actionType, setActionType] = useState('')

  const ReportIcon = getReportIcon(report.reported_type)
  const CategoryIcon = getCategoryIcon(report.report_type)
  const priorityInfo = PRIORITY_LEVELS[report.priority]

  const handleActionWithNotes = (action) => {
    if (action === 'resolve' || action === 'dismiss') {
      setActionType(action)
      setShowNotesModal(true)
    } else {
      onAction(report.id, action)
    }
  }

  const submitAction = () => {
    onAction(report.id, actionType, notes)
    setShowNotesModal(false)
    setNotes('')
    setActionType('')
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="p-6 hover:bg-gray-50 transition-all duration-200"
      >
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
                <div className="flex items-center space-x-3 mb-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="p-2 bg-gray-100 rounded-lg"
                  >
                    <ReportIcon className="h-5 w-5 text-gray-600" />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    className="p-2 bg-red-100 rounded-lg"
                  >
                    <CategoryIcon className="h-5 w-5 text-red-600" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{report.description}</h3>
                    <p className="text-sm text-gray-600">
                      {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)} report
                    </p>
                  </div>
                  {getStatusBadge(report.status)}
                  <motion.span 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`px-3 py-1 text-xs font-medium rounded-full ${priorityInfo.color}`}
                  >
                    {priorityInfo.label} Priority
                  </motion.span>
                </div>
                
                <div className="flex items-center flex-wrap gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    Reported by: {report.reported_by.name}
                  </span>
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {timeAgo(report.created_at)}
                  </span>
                  {report.assigned_to && (
                    <span className="flex items-center">
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Assigned to: {report.assigned_to.name}
                    </span>
                  )}
                  {report.evidence.length > 0 && (
                    <span className="flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      {report.evidence.length} evidence file{report.evidence.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  <span className="font-medium text-gray-700">
                    Reported Item: {report.reported_item.title}
                  </span>
                  <span className="text-gray-500">
                    {report.reported_item.subtitle}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-6">
                <motion.button
                  onClick={onToggleExpand}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isExpanded ? "Hide details" : "Show details"}
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDownIcon className="h-5 w-5" />
                  </motion.div>
                </motion.button>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {report.status === 'pending' && (
                    <>
                      <ActionButton 
                        onClick={() => onAction(report.id, 'investigate')}
                        disabled={isProcessing}
                        color="blue"
                        icon={EyeIcon}
                      >
                        Investigate
                      </ActionButton>
                      <ActionButton 
                        onClick={() => onAction(report.id, 'assign')}
                        disabled={isProcessing}
                        color="purple"
                        icon={CheckIcon}
                      >
                        Assign
                      </ActionButton>
                    </>
                  )}

                  {(report.status === 'investigating' || report.status === 'pending') && (
                    <>
                      <ActionButton 
                        onClick={() => handleActionWithNotes('resolve')}
                        disabled={isProcessing}
                        color="green"
                        icon={CheckIcon}
                      >
                        Resolve
                      </ActionButton>
                      <ActionButton 
                        onClick={() => handleActionWithNotes('dismiss')}
                        disabled={isProcessing}
                        color="gray"
                        icon={XMarkIcon}
                      >
                        Dismiss
                      </ActionButton>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Report Details */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Report Details
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <strong className="text-gray-700">Reporter:</strong>
                          <p className="text-gray-600 mt-1">
                            {report.reported_by.name} ({report.reported_by.email})
                          </p>
                        </div>
                        <div>
                          <strong className="text-gray-700">Reported Item:</strong>
                          <p className="text-gray-600 mt-1">
                            {report.reported_item.type} - {report.reported_item.title}
                          </p>
                        </div>
                        <div>
                          <strong className="text-gray-700">Created:</strong>
                          <p className="text-gray-600 mt-1">{formatDate(report.created_at)}</p>
                        </div>
                        <div>
                          <strong className="text-gray-700">Last Updated:</strong>
                          <p className="text-gray-600 mt-1">{formatDate(report.updated_at)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Evidence & Actions */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <ShieldExclamationIcon className="h-5 w-5 mr-2 text-orange-600" />
                        Evidence & Actions
                      </h4>
                      <div className="space-y-3 text-sm">
                        {report.evidence.length > 0 ? (
                          <div>
                            <strong className="text-gray-700">Evidence Files:</strong>
                            <div className="mt-2 space-y-2">
                              {report.evidence.map((evidence, index) => (
                                <motion.div 
                                  key={evidence.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="flex items-center p-2 bg-white rounded-lg border"
                                >
                                  <DocumentTextIcon className="h-4 w-4 text-blue-600 mr-2" />
                                  <a 
                                    href={evidence.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-600 hover:underline"
                                  >
                                    {evidence.type} Evidence {index + 1}
                                  </a>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No evidence files attached</p>
                        )}

                        {report.assigned_to && (
                          <div>
                            <strong className="text-gray-700">Assigned To:</strong>
                            <p className="text-gray-600 mt-1">{report.assigned_to.name}</p>
                          </div>
                        )}

                        {report.resolution_notes && (
                          <div>
                            <strong className="text-gray-700">Resolution Notes:</strong>
                            <p className="text-gray-600 mt-1 p-3 bg-white rounded-lg border">
                              {report.resolution_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Notes Modal */}
      <AnimatePresence>
        {showNotesModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {actionType === 'resolve' ? 'Resolve Report' : 'Dismiss Report'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide notes for this action to maintain transparency:
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6 transition-all duration-200"
                rows={4}
                placeholder="Enter detailed resolution/dismissal notes..."
              />
              <div className="flex justify-end space-x-3">
                <motion.button
                  onClick={() => setShowNotesModal(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={submitAction}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-2 text-white rounded-xl transition-colors ${
                    actionType === 'resolve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {actionType === 'resolve' ? 'Resolve Report' : 'Dismiss Report'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ActionButton({ onClick, disabled, color, icon: Icon, children }) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    gray: 'bg-gray-600 hover:bg-gray-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    red: 'bg-red-600 hover:bg-red-700'
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center px-4 py-2 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses[color]}`}
    >
      <Icon className="h-4 w-4 mr-1" />
      {children}
    </motion.button>
  )
}

function AdminReportsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded-xl w-32"></div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="h-6 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>

        {/* Filters skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="h-12 bg-gray-200 rounded-xl w-64"></div>
              <div className="flex space-x-4">
                <div className="h-12 bg-gray-200 rounded-xl w-32"></div>
                <div className="h-12 bg-gray-200 rounded-xl w-32"></div>
                <div className="h-12 bg-gray-200 rounded-xl w-32"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Reports list skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-6">
                <div className="flex items-start">
                  <div className="h-4 w-4 bg-gray-200 rounded mt-1"></div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded w-64 mb-3"></div>
                        <div className="flex space-x-4 mb-3">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                        <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                        <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
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