// src/pages/admin/Reports.jsx
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams } from 'react-router-dom'
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
  ChevronUpIcon
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
  'content': 'Content Reports',
  'spam': 'Spam Reports',
  'harassment': 'Harassment',
  'inappropriate': 'Inappropriate Content',
  'fake': 'Fake Information',
  'other': 'Other'
}

const REPORT_STATUSES = {
  'all': 'All Statuses',
  'pending': 'Pending Review',
  'investigating': 'Under Investigation',
  'resolved': 'Resolved',
  'dismissed': 'Dismissed',
  'escalated': 'Escalated'
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
  }, [profile, selectedType, selectedStatus])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedType !== 'all') params.set('type', selectedType)
    if (selectedStatus !== 'all') params.set('status', selectedStatus)
    setSearchParams(params)
  }, [selectedType, selectedStatus, setSearchParams])

  const fetchReports = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching reports for admin...')

      // Since we don't have a reports table yet, we'll create mock data
      // In a real implementation, you would query your reports table
      const mockReports = generateMockReports()
      
      console.log(`✅ Fetched ${mockReports.length} reports`)
      setReports(mockReports)

      // Calculate stats
      const reportStats = mockReports.reduce((acc, report) => {
        acc.total++
        if (report.status === 'pending') acc.pending++
        else if (report.status === 'investigating') acc.investigating++
        else if (report.status === 'resolved') acc.resolved++
        else if (report.status === 'dismissed') acc.dismissed++
        
        if (report.priority === 'critical') acc.critical++
        
        return acc
      }, { total: 0, pending: 0, investigating: 0, resolved: 0, dismissed: 0, critical: 0 })

      setStats(reportStats)

    } catch (error) {
      console.error('❌ Error fetching reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  // Mock data generator - replace with real database queries
  const generateMockReports = () => {
    const types = ['user', 'job', 'message', 'content', 'spam', 'harassment', 'inappropriate', 'fake']
    const statuses = ['pending', 'investigating', 'resolved', 'dismissed']
    const priorities = ['low', 'medium', 'high', 'critical']
    const reasons = [
      'Inappropriate content posted',
      'Fake job posting detected',
      'Harassment via messages',
      'Spam content',
      'Misleading information',
      'Inappropriate behavior',
      'Fake company information',
      'Abusive language',
      'Scam job posting',
      'Privacy violation'
    ]

    return Array.from({ length: 50 }, (_, i) => ({
      id: `report-${i + 1}`,
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      title: reasons[Math.floor(Math.random() * reasons.length)],
      description: `Detailed description of the report issue. This is a sample description for report ${i + 1}.`,
      reported_by: {
        id: `user-${Math.floor(Math.random() * 100)}`,
        name: `User ${Math.floor(Math.random() * 100)}`,
        email: `user${Math.floor(Math.random() * 100)}@example.com`
      },
      reported_item: {
        id: `item-${Math.floor(Math.random() * 100)}`,
        type: types[Math.floor(Math.random() * types.length)],
        title: `Reported Item ${Math.floor(Math.random() * 100)}`
      },
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      assigned_to: Math.random() > 0.5 ? {
        id: profile?.id,
        name: profile?.full_name || 'Admin'
      } : null,
      resolution_notes: Math.random() > 0.7 ? 'Report has been reviewed and appropriate action taken.' : null,
      evidence: Math.random() > 0.6 ? [
        { type: 'screenshot', url: 'https://example.com/evidence1.png' },
        { type: 'message', content: 'Evidence message content' }
      ] : []
    }))
  }

  const filteredReports = useMemo(() => {
    let filtered = reports

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(report => report.type === selectedType)
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(report => report.status === selectedStatus)
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(report =>
        report.title?.toLowerCase().includes(term) ||
        report.description?.toLowerCase().includes(term) ||
        report.reported_by?.name?.toLowerCase().includes(term) ||
        report.reported_by?.email?.toLowerCase().includes(term) ||
        report.reported_item?.title?.toLowerCase().includes(term)
      )
    }

    // Sort by priority and creation date
    return filtered.sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [reports, selectedType, selectedStatus, searchTerm])

  const handleReportAction = async (reportId, action, notes = null) => {
    try {
      setProcessing(prev => new Set([...prev, reportId]))
      console.log(`🔄 ${action}ing report ${reportId}...`)

      // Simulate API call - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 1000))

      let updates = {}
      
      switch (action) {
        case 'investigate':
          updates = { 
            status: 'investigating', 
            assigned_to: { id: profile.id, name: profile.full_name },
            updated_at: new Date().toISOString()
          }
          break
        case 'resolve':
          updates = { 
            status: 'resolved', 
            resolution_notes: notes || 'Report resolved',
            updated_at: new Date().toISOString()
          }
          break
        case 'dismiss':
          updates = { 
            status: 'dismissed', 
            resolution_notes: notes || 'Report dismissed',
            updated_at: new Date().toISOString()
          }
          break
        case 'escalate':
          updates = { 
            status: 'escalated', 
            priority: 'critical',
            updated_at: new Date().toISOString()
          }
          break
        case 'assign':
          updates = { 
            assigned_to: { id: profile.id, name: profile.full_name },
            updated_at: new Date().toISOString()
          }
          break
      }

      // Update local state
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId 
            ? { ...report, ...updates }
            : report
        )
      )

      // Update stats
      await fetchReports() // Refresh to recalculate stats

      toast.success(
        action === 'investigate' ? 'Report assigned for investigation' :
        action === 'resolve' ? 'Report resolved successfully' :
        action === 'dismiss' ? 'Report dismissed' :
        action === 'escalate' ? 'Report escalated' :
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
      case 'spam':
      case 'harassment':
      case 'inappropriate':
      case 'fake':
        return FlagIcon
      default:
        return ExclamationTriangleIcon
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'investigating': 'bg-blue-100 text-blue-800',
      'resolved': 'bg-green-100 text-green-800',
      'dismissed': 'bg-gray-100 text-gray-800',
      'escalated': 'bg-red-100 text-red-800'
    }
    
    const labels = {
      'pending': 'Pending',
      'investigating': 'Investigating',
      'resolved': 'Resolved',
      'dismissed': 'Dismissed',
      'escalated': 'Escalated'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status] || badges.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading && reports.length === 0) {
    return <AdminReportsSkeleton />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Handle Reports - Admin Dashboard</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Handle Reports</h1>
          <p className="mt-2 text-gray-600">
            Review and resolve user reports and issues
          </p>
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Reports</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.investigating}</div>
          <div className="text-sm text-gray-600">Investigating</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          <div className="text-sm text-gray-600">Resolved</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-600">{stats.dismissed}</div>
          <div className="text-sm text-gray-600">Dismissed</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.critical}</div>
          <div className="text-sm text-gray-600">Critical</div>
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
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(REPORT_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(REPORT_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedReports.size > 0 && (
            <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-sm text-blue-800">
                  {selectedReports.size} report{selectedReports.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('investigate')}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Investigate All
                </button>
                <button
                  onClick={() => handleBulkAction('resolve')}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Resolve All
                </button>
                <button
                  onClick={() => handleBulkAction('dismiss')}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  Dismiss All
                </button>
                <button
                  onClick={() => setSelectedReports(new Set())}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedReports.size === filteredReports.length && filteredReports.length > 0}
              onChange={selectAllReports}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm font-medium text-gray-900">
              Select All ({filteredReports.length})
            </span>
          </div>
        </div>

        {/* Reports */}
        <div className="divide-y divide-gray-200">
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria' : 'No reports match the current filters'}
              </p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                isSelected={selectedReports.has(report.id)}
                onToggleSelect={() => toggleReportSelection(report.id)}
                onAction={handleReportAction}
                isProcessing={processing.has(report.id)}
                isExpanded={expandedReport === report.id}
                onToggleExpand={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                getReportIcon={getReportIcon}
                getStatusBadge={getStatusBadge}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function ReportRow({ 
  report, 
  isSelected, 
  onToggleSelect, 
  onAction, 
  isProcessing, 
  isExpanded, 
  onToggleExpand,
  getReportIcon,
  getStatusBadge
}) {
  const [notes, setNotes] = useState('')
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [actionType, setActionType] = useState('')

  const ReportIcon = getReportIcon(report.type)
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
                  <ReportIcon className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
                  {getStatusBadge(report.status)}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityInfo.color}`}>
                    {priorityInfo.label} Priority
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                  <span>Type: {report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  <span>Reported by: {report.reported_by.name}</span>
                  <span>Created: {timeAgo(report.created_at)}</span>
                  {report.assigned_to && (
                    <span>Assigned to: {report.assigned_to.name}</span>
                  )}
                </div>

                <p className="text-sm text-gray-700 line-clamp-2 mb-2">{report.description}</p>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Item: {report.reported_item.title}</span>
                  <span>Updated: {timeAgo(report.updated_at)}</span>
                  {report.evidence.length > 0 && (
                    <span>{report.evidence.length} evidence file{report.evidence.length !== 1 ? 's' : ''}</span>
                  )}
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

                {report.status === 'pending' && (
                  <>
                    <button
                      onClick={() => onAction(report.id, 'investigate')}
                      disabled={isProcessing}
                      className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Investigate
                    </button>
                    <button
                      onClick={() => onAction(report.id, 'assign')}
                      disabled={isProcessing}
                      className="flex items-center px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      Assign to Me
                    </button>
                  </>
                )}

                {(report.status === 'investigating' || report.status === 'pending') && (
                  <>
                    <button
                      onClick={() => handleActionWithNotes('resolve')}
                      disabled={isProcessing}
                      className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Resolve
                    </button>
                    <button
                      onClick={() => handleActionWithNotes('dismiss')}
                      disabled={isProcessing}
                      className="flex items-center px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Dismiss
                    </button>
                  </>
                )}

                {report.priority !== 'critical' && report.status !== 'resolved' && (
                  <button
                    onClick={() => onAction(report.id, 'escalate')}
                    disabled={isProcessing}
                    className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    Escalate
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Report Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Report Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Full Description:</strong></p>
                      <p className="text-gray-700">{report.description}</p>
                      <p><strong>Reporter:</strong> {report.reported_by.name} ({report.reported_by.email})</p>
                      <p><strong>Reported Item:</strong> {report.reported_item.type} - {report.reported_item.title}</p>
                      <p><strong>Created:</strong> {formatDate(report.created_at)}</p>
                      <p><strong>Last Updated:</strong> {formatDate(report.updated_at)}</p>
                    </div>
                  </div>

                  {/* Evidence & Actions */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Evidence & Actions</h4>
                    <div className="space-y-2 text-sm">
                      {report.evidence.length > 0 ? (
                        <div>
                          <strong>Evidence Files:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {report.evidence.map((evidence, index) => (
                              <li key={index} className="text-blue-600">
                                {evidence.type === 'screenshot' ? 'Screenshot' : 'Message'}: 
                                {evidence.url && (
                                  <a href={evidence.url} target="_blank" rel="noopener noreferrer" className="ml-1 hover:underline">
                                    View Evidence
                                  </a>
                                )}
                                {evidence.content && (
                                  <span className="ml-1 text-gray-600">"{evidence.content}"</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-gray-500">No evidence files attached</p>
                      )}

                      {report.assigned_to && (
                        <p><strong>Assigned To:</strong> {report.assigned_to.name}</p>
                      )}

                      {report.resolution_notes && (
                        <div>
                          <strong>Resolution Notes:</strong>
                          <p className="text-gray-700 mt-1">{report.resolution_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {actionType === 'resolve' ? 'Resolve Report' : 'Dismiss Report'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide notes for this action:
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows={3}
              placeholder="Enter resolution/dismissal notes..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                className={`px-4 py-2 text-white rounded-lg ${
                  actionType === 'resolve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {actionType === 'resolve' ? 'Resolve' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
          <div className="h-10 bg-gray-200 rounded w-24"></div>
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

        {/* Filters skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="h-10 bg-gray-200 rounded w-64"></div>
              <div className="flex space-x-4">
                <div className="h-10 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Reports list skeleton */}
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
                        <div className="flex space-x-4 mb-2">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="flex space-x-4">
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
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
