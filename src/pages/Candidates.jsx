// src/pages/Candidates.jsx - Enhanced with detailed application view
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  UserIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  StarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

import { useAuth } from '../contexts/AuthContext'
import { supabase, TABLES, APPLICATION_STATUSES, USER_ROLES } from '../lib/supabase'
import { formatDate, timeAgo, getInitials, getAvatarColor, formatPhoneNumber } from '../lib/utils'

const APPLICATION_STATUS_FILTERS = {
  'all': 'All Applications',
  'applied': 'New Applications',
  'viewed': 'Viewed',
  'shortlisted': 'Shortlisted',
  'interview': 'Interview',
  'offered': 'Offered',
  'rejected': 'Rejected'
}

const getStatusBadge = (status) => {
  const badges = {
    'applied': 'bg-blue-100 text-blue-800',
    'viewed': 'bg-gray-100 text-gray-800',
    'shortlisted': 'bg-yellow-100 text-yellow-800',
    'interview': 'bg-purple-100 text-purple-800',
    'offered': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'withdrawn': 'bg-gray-100 text-gray-600'
  }

  const labels = {
    'applied': 'New',
    'viewed': 'Viewed',
    'shortlisted': 'Shortlisted',
    'interview': 'Interview',
    'offered': 'Offered',
    'rejected': 'Rejected',
    'withdrawn': 'Withdrawn'
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status] || badges.applied}`}>
      {labels[status] || status}
    </span>
  )
}

export default function Candidates() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedJob, setSelectedJob] = useState('all')
  const [jobs, setJobs] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (profile?.id && profile?.role === USER_ROLES.EMPLOYER) {
      fetchApplications()
      fetchEmployerJobs()
    }
  }, [profile, selectedStatus, selectedJob])

  const fetchEmployerJobs = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.JOBS || 'jobs')
        .select('id, title, status')
        .eq('employer_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching jobs:', error)
        return
      }
      
      setJobs(data || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const fetchApplications = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching applications for employer:', profile.id)
      
      // Get employer's job IDs first
      const { data: employerJobs, error: jobsError } = await supabase
        .from(TABLES.JOBS || 'jobs')
        .select('id, title, employment_type, location')
        .eq('employer_id', profile.id)

      if (jobsError) {
        console.error('❌ Error fetching employer jobs:', jobsError)
        throw jobsError
      }

      if (!employerJobs || employerJobs.length === 0) {
        console.log('📝 No jobs found for employer')
        setApplications([])
        return
      }

      const jobIds = employerJobs.map(job => job.id)
      console.log('📊 Found jobs:', jobIds)

      // Get applications for these jobs
      let applicationsQuery = supabase
        .from(TABLES.APPLICATIONS || 'applications')
        .select('*')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })

      // Apply status filter
      if (selectedStatus !== 'all') {
        applicationsQuery = applicationsQuery.eq('status', selectedStatus)
      }

      // Apply job filter
      if (selectedJob !== 'all') {
        applicationsQuery = applicationsQuery.eq('job_id', selectedJob)
      }

      const { data: rawApplications, error: applicationsError } = await applicationsQuery

      if (applicationsError) {
        console.error('❌ Error fetching applications:', applicationsError)
        throw applicationsError
      }

      if (!rawApplications || rawApplications.length === 0) {
        console.log('📝 No applications found')
        setApplications([])
        return
      }

      console.log('📊 Found applications:', rawApplications.length)

      // Get unique applicant IDs
      const applicantIds = [...new Set(rawApplications.map(app => app.applicant_id))]
      console.log('👥 Unique applicants:', applicantIds.length)

      // Fetch applicant profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, phone, location')
        .in('id', applicantIds)

      if (profilesError) {
        console.warn('⚠️ Error fetching profiles (non-critical):', profilesError)
      }

      // Merge all data together
      const enrichedApplications = rawApplications.map(application => {
        const job = employerJobs.find(j => j.id === application.job_id)
        const profile = profiles?.find(p => p.id === application.applicant_id)

        return {
          ...application,
          jobs: job || {
            id: application.job_id,
            title: 'Unknown Job',
            employment_type: null,
            location: null
          },
          profiles: profile || {
            id: application.applicant_id,
            full_name: 'Unknown Applicant',
            email: null,
            avatar_url: null,
            phone: null,
            location: null
          }
        }
      })

      console.log('✅ Successfully enriched applications:', enrichedApplications.length)
      setApplications(enrichedApplications)
      
    } catch (error) {
      console.error('❌ Error in fetchApplications:', error)
      toast.error(`Failed to load candidates: ${error.message}`)
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = useMemo(() => {
    if (!searchTerm.trim()) return applications

    const term = searchTerm.toLowerCase()
    return applications.filter(app => {
      // Search in basic profile data
      const basicMatch = 
        app.profiles?.full_name?.toLowerCase().includes(term) ||
        app.profiles?.email?.toLowerCase().includes(term) ||
        app.jobs?.title?.toLowerCase().includes(term)

      // Search in detailed application data
      const customData = app.custom_responses
      let detailedMatch = false
      
      if (customData) {
        // Search in personal info
        if (customData.personal_info) {
          detailedMatch = detailedMatch ||
            customData.personal_info.career_objectives?.toLowerCase().includes(term) ||
            customData.personal_info.address?.toLowerCase().includes(term)
        }
        
        // Search in education
        if (customData.education) {
          detailedMatch = detailedMatch ||
            customData.education.college_degree?.toLowerCase().includes(term) ||
            customData.education.school_attended?.toLowerCase().includes(term)
        }
        
        // Search in work experience
        if (customData.work_experiences) {
          detailedMatch = detailedMatch ||
            customData.work_experiences.some(exp =>
              exp.position?.toLowerCase().includes(term) ||
              exp.previous_employer?.toLowerCase().includes(term) ||
              exp.duties_responsibilities?.toLowerCase().includes(term)
            )
        }
      }

      return basicMatch || detailedMatch
    })
  }, [applications, searchTerm])

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const { error } = await supabase
        .from(TABLES.APPLICATIONS || 'applications')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (error) throw error

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus }
            : app
        )
      )

      toast.success(`Application status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating application status:', error)
      toast.error('Failed to update status')
    }
  }

  const startConversation = async (application) => {
    try {
      console.log('🚀 Starting conversation for application:', application.id)
      
      // Check if conversation already exists for this application
      const { data: existingMessage, error: checkError } = await supabase
        .from(TABLES.MESSAGES || 'messages')
        .select('id')
        .eq('application_id', application.id)
        .limit(1)

      if (checkError) {
        console.warn('⚠️ Error checking existing conversation:', checkError)
      }

      // If no existing conversation, create initial message
      if (!existingMessage || existingMessage.length === 0) {
        console.log('💬 Creating new conversation')
        
        const { error: messageError } = await supabase
          .from(TABLES.MESSAGES || 'messages')
          .insert([{
            sender_id: profile.id,
            recipient_id: application.applicant_id,
            application_id: application.id,
            content: `Hi ${application.profiles?.full_name?.split(' ')[0] || 'there'}! I saw your application for the ${application.jobs?.title} position. I'd like to discuss this opportunity with you.`,
          }])

        if (messageError) {
          console.error('❌ Error creating message:', messageError)
          throw new Error('Failed to create conversation')
        }
        
        console.log('✅ Message created successfully')
      } else {
        console.log('📧 Conversation already exists')
      }

      // Navigate to messages page with application context
      navigate('/messages', { 
        state: { 
          selectedApplicationId: application.id,
          selectedUserId: application.applicant_id
        }
      })

    } catch (error) {
      console.error('❌ Error starting conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  if (loading) {
    return <CandidatesSkeleton />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Candidates - JobFinder</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
          <p className="mt-2 text-gray-600">
            Manage applications and connect with potential hires
          </p>
          {filteredApplications.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {filteredApplications.length} candidate{filteredApplications.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border rounded-lg shadow-sm transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
          <Link
            to="/post-job"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <BriefcaseIcon className="h-5 w-5 mr-2" />
            Post New Job
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Candidates
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, skills, education..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(APPLICATION_STATUS_FILTERS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Job Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Position
              </label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Jobs</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-16">
          <UserIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No candidates found
          </h3>
          <p className="text-gray-600 mb-6">
            {applications.length === 0 
              ? "You haven't received any applications yet. Post a job to start receiving applications."
              : "No candidates match your current filters. Try adjusting your search criteria."
            }
          </p>
          {applications.length === 0 && (
            <Link
              to="/post-job"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              Post Your First Job
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <EnhancedCandidateCard
              key={application.id}
              application={application}
              onUpdateStatus={updateApplicationStatus}
              onStartConversation={startConversation}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Document Viewer Modal Component
function DocumentViewerModal({ documentUrl, documentTitle, isOpen, onClose }) {
  if (!isOpen) return null

  const isImage = documentUrl && (documentUrl.includes('.jpg') || documentUrl.includes('.jpeg') || documentUrl.includes('.png'))
  const isPDF = documentUrl && documentUrl.includes('.pdf')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{documentTitle}</h3>
          <div className="flex items-center space-x-2">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Download
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="p-4 max-h-[calc(90vh-80px)] overflow-auto">
          {isImage ? (
            <div className="flex justify-center">
              <img
                src={documentUrl}
                alt={documentTitle}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
              <div className="hidden text-center py-8">
                <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500">Unable to load image</p>
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Open in new tab
                </a>
              </div>
            </div>
          ) : isPDF ? (
            <div className="w-full h-96">
              <iframe
                src={documentUrl}
                className="w-full h-full border-0"
                title={documentTitle}
                onError={() => {
                  // Fallback for PDF viewing issues
                }}
              />
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-2">
                  PDF not displaying correctly?
                </p>
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Open in new tab
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">
                Preview not available for this file type
              </p>
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Download File
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function EnhancedCandidateCard({ application, onUpdateStatus, onStartConversation }) {
  const [showDetails, setShowDetails] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    documentUrl: '',
    documentTitle: ''
  })
  
  const candidate = application.profiles
  const customData = application.custom_responses || {}

  const tabs = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'personal', label: 'Personal Info', count: null },
    { id: 'education', label: 'Education', count: null },
    { id: 'experience', label: 'Work Experience', count: customData.work_experiences?.length || 0 },
    { id: 'documents', label: 'Documents', count: Object.values(customData.documents || {}).filter(Boolean).length }
  ]

  // Function to open document viewer modal
  const openDocumentViewer = (documentUrl, documentTitle) => {
    setViewerState({
      isOpen: true,
      documentUrl,
      documentTitle
    })
  }

  const closeDocumentViewer = () => {
    setViewerState({
      isOpen: false,
      documentUrl: '',
      documentTitle: ''
    })
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            {candidate?.avatar_url ? (
              <img
                src={candidate.avatar_url}
                alt={candidate.full_name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className={`h-16 w-16 rounded-full flex items-center justify-center text-white text-lg font-semibold ${getAvatarColor(candidate?.full_name || 'User')}`}>
                {getInitials(candidate?.full_name || customData.personal_info?.full_name || 'User')}
              </div>
            )}

            {/* Candidate Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {candidate?.full_name || customData.personal_info?.full_name || 'Unnamed Candidate'}
                </h3>
                {getStatusBadge(application.status)}
                {application.applied_via === 'application_form' && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Detailed Application
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center">
                  <BriefcaseIcon className="h-4 w-4 mr-1" />
                  <span>Applied for: {application.jobs?.title}</span>
                </div>
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                  <span>Applied {timeAgo(application.created_at)}</span>
                </div>
                {customData.education?.college_degree && (
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-4 w-4 mr-1" />
                    <span>{customData.education.college_degree}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {(candidate?.email || customData.personal_info?.email) && (
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    <span>{candidate?.email || customData.personal_info?.email}</span>
                  </div>
                )}
                {(candidate?.location || customData.personal_info?.address) && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span>{candidate?.location || customData.personal_info?.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onStartConversation(application)}
              className="flex items-center px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
              Message
            </button>
            
            <div className="relative group">
              <button className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Status
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {Object.values(APPLICATION_STATUSES).map(status => (
                  <button
                    key={status}
                    onClick={() => onUpdateStatus(application.id, status)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      application.status === status ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {showDetails ? (
                <>
                  <ChevronUpIcon className="h-4 w-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDownIcon className="h-4 w-4 mr-1" />
                  View Details
                </>
              )}
            </button>
          </div>
        </div>

        {/* Career Objectives Preview */}
        {customData.personal_info?.career_objectives && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 italic line-clamp-2">
              "{customData.personal_info.career_objectives}"
            </p>
          </div>
        )}

        {/* Expanded Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== null && tab.count > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[200px]">
                {activeTab === 'overview' && <OverviewTab application={application} />}
                {activeTab === 'personal' && <PersonalInfoTab data={customData.personal_info} />}
                {activeTab === 'education' && <EducationTab data={customData.education} />}
                {activeTab === 'experience' && <ExperienceTab data={customData.work_experiences} />}
                {activeTab === 'documents' && (
                  <DocumentsTab 
                    data={customData.documents} 
                    onViewDocument={openDocumentViewer}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {viewerState.isOpen && (
          <DocumentViewerModal
            documentUrl={viewerState.documentUrl}
            documentTitle={viewerState.documentTitle}
            isOpen={viewerState.isOpen}
            onClose={closeDocumentViewer}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function OverviewTab({ application }) {
  const customData = application.custom_responses || {}
  
  return (
    <div className="space-y-6">
      {/* Cover Letter */}
      {application.cover_letter && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Cover Letter</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {application.cover_letter}
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {customData.education?.year_graduated && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">Graduated</p>
                <p className="text-lg font-semibold text-blue-600">{customData.education.year_graduated}</p>
              </div>
            </div>
          </div>
        )}

        {customData.work_experiences?.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <BriefcaseIcon className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-900">Work Experience</p>
                <p className="text-lg font-semibold text-green-600">
                  {customData.work_experiences.length} position{customData.work_experiences.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {customData.documents && Object.values(customData.documents).filter(Boolean).length > 0 && (
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-purple-900">Documents</p>
                <p className="text-lg font-semibold text-purple-600">
                  {Object.values(customData.documents).filter(Boolean).length} uploaded
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Notes */}
      {customData.additional_notes && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Additional Notes</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {customData.additional_notes}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function PersonalInfoTab({ data }) {
  if (!data) {
    return (
      <div className="text-center py-8">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        <p className="text-gray-500">No personal information available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.full_name && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <p className="text-gray-900">{data.full_name}</p>
          </div>
        )}
        
        {data.email && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <a href={`mailto:${data.email}`} className="text-blue-600 hover:underline">
              {data.email}
            </a>
          </div>
        )}
        
        {data.contact_number && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
            <a href={`tel:${data.contact_number}`} className="text-blue-600 hover:underline">
              {formatPhoneNumber(data.contact_number)}
            </a>
          </div>
        )}
        
        {data.birthdate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
            <p className="text-gray-900">{formatDate(data.birthdate)}</p>
          </div>
        )}
      </div>

      {data.address && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <p className="text-gray-900">{data.address}</p>
        </div>
      )}

      {data.career_objectives && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Career Objectives</label>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 leading-relaxed">{data.career_objectives}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function EducationTab({ data }) {
  if (!data) {
    return (
      <div className="text-center py-8">
        <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        <p className="text-gray-500">No education information available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 rounded-full p-3">
            <AcademicCapIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            {data.college_degree && (
              <h3 className="text-lg font-semibold text-blue-900 mb-2">{data.college_degree}</h3>
            )}
            {data.school_attended && (
              <p className="text-blue-700 mb-2">{data.school_attended}</p>
            )}
            {data.year_graduated && (
              <p className="text-sm text-blue-600">Graduated: {data.year_graduated}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ExperienceTab({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        <p className="text-gray-500">No work experience information available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {data.map((experience, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-gray-200 rounded-full p-3">
              <BriefcaseIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1">
              {experience.position && (
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{experience.position}</h3>
              )}
              {experience.previous_employer && (
                <p className="text-gray-700 mb-2">{experience.previous_employer}</p>
              )}
              {experience.duration && (
                <p className="text-sm text-gray-500 mb-3">{experience.duration}</p>
              )}
              {experience.duties_responsibilities && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Duties & Responsibilities</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{experience.duties_responsibilities}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DocumentsTab({ data, onViewDocument }) {
  if (!data) {
    return (
      <div className="text-center py-8">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        <p className="text-gray-500">No documents uploaded</p>
      </div>
    )
  }

  const documents = [
    { key: 'resume_url', label: 'Resume', required: true },
    { key: 'id_url', label: 'Valid ID', required: true },
    { key: 'otr_url', label: 'Official Transcript (OTR)', required: false },
    { key: 'diploma_url', label: 'Diploma', required: false }
  ]

  const availableDocuments = documents.filter(doc => data[doc.key])

  if (availableDocuments.length === 0) {
    return (
      <div className="text-center py-8">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        <p className="text-gray-500">No documents uploaded</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableDocuments.map((doc) => (
          <div key={doc.key} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{doc.label}</h4>
                  {doc.required && (
                    <span className="text-xs text-red-600">Required</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onViewDocument(data[doc.key], doc.label)}
                className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CandidatesSkeleton() {
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
            <div className="h-10 bg-gray-200 rounded w-20"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-10 w-20 bg-gray-200 rounded"></div>
                  <div className="h-10 w-16 bg-gray-200 rounded"></div>
                  <div className="h-10 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}