// src/pages/Applications.jsx - Enhanced with credentials submission and improved file upload
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserIcon,
  AcademicCapIcon,
  PlusIcon,
  TrashIcon,
  CloudArrowUpIcon,
  PencilIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

import { useAuth } from '../contexts/AuthContext'
import { supabase, TABLES, USER_ROLES } from '../lib/supabase'
import { formatDate, timeAgo, formatSalary } from '../lib/utils'

const APPLICATION_STATUS_FILTERS = {
  'all': 'All Applications',
  'applied': 'Applied',
  'viewed': 'Viewed',
  'shortlisted': 'Shortlisted',
  'interview': 'Interview',
  'hired': 'Hired',
  'rejected': 'Rejected',
  'withdrawn': 'Withdrawn'
}

const getStatusBadge = (status) => {
  const badges = {
    'applied': 'bg-blue-100 text-blue-800',
    'viewed': 'bg-gray-100 text-gray-800',
    'shortlisted': 'bg-yellow-100 text-yellow-800',
    'interview': 'bg-purple-100 text-purple-800',
    'hired': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'withdrawn': 'bg-gray-100 text-gray-600'
  }

  const labels = {
    'applied': 'Applied',
    'viewed': 'Viewed',
    'shortlisted': 'Shortlisted',
    'interview': 'Interview',
    'hired': 'Hired',
    'rejected': 'Rejected',
    'withdrawn': 'Withdrawn'
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status] || badges.applied}`}>
      {labels[status] || status}
    </span>
  )
}

export default function Applications() {
  const { profile } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (profile?.id && profile?.role === USER_ROLES.JOB_SEEKER) {
      fetchApplications()
    }
  }, [profile, selectedStatus])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching applications for job seeker:', profile.id)
      
      let query = supabase
        .from(TABLES.APPLICATIONS || 'applications')
        .select(`
          *,
          jobs (
            id,
            title,
            employment_type,
            location,
            salary_min,
            salary_max,
            salary_currency,
            is_remote,
            status,
            employer_id
          )
        `)
        .eq('applicant_id', profile.id)
        .order('created_at', { ascending: false })

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data: rawApplications, error: applicationsError } = await query

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

      const employerIds = [...new Set(rawApplications.map(app => app.jobs?.employer_id).filter(Boolean))]

      let employerProfiles = []
      if (employerIds.length > 0) {
        const { data: employers, error: employersError } = await supabase
          .from('employer_profiles')
          .select('user_id, company_name, company_logo_url, industry')
          .in('user_id', employerIds)

        if (employersError) {
          console.warn('⚠️ Error fetching employer profiles (non-critical):', employersError)
        } else {
          employerProfiles = employers || []
        }
      }

      const enrichedApplications = rawApplications.map(application => {
        const employerProfile = employerProfiles.find(emp => emp.user_id === application.jobs?.employer_id)
        
        return {
          ...application,
          employer_profile: employerProfile || {
            company_name: 'Unknown Company',
            company_logo_url: null,
            industry: null
          }
        }
      })

      console.log('✅ Successfully enriched applications:', enrichedApplications.length)
      setApplications(enrichedApplications)
      
    } catch (error) {
      console.error('❌ Error in fetchApplications:', error)
      toast.error(`Failed to load applications: ${error.message}`)
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = useMemo(() => {
    if (!searchTerm.trim()) return applications

    const term = searchTerm.toLowerCase()
    return applications.filter(app => 
      app.jobs?.title?.toLowerCase().includes(term) ||
      app.employer_profile?.company_name?.toLowerCase().includes(term) ||
      app.jobs?.location?.toLowerCase().includes(term) ||
      app.employer_profile?.industry?.toLowerCase().includes(term)
    )
  }, [applications, searchTerm])

  if (profile?.role !== USER_ROLES.JOB_SEEKER) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600">
            This page is only available for job seekers.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <ApplicationsSkeleton />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>My Applications - JobFinder</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="mt-2 text-gray-600">
            Track your job applications and manage your credentials
          </p>
          {filteredApplications.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} found
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
            to="/jobs"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <BriefcaseIcon className="h-5 w-5 mr-2" />
            Find More Jobs
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Applications
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by job title, company, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

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
          </div>
        </motion.div>
      )}

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-16">
          <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {applications.length === 0 ? 'No applications yet' : 'No applications found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {applications.length === 0 
              ? "You haven't applied to any jobs yet. Start browsing and applying to opportunities that interest you."
              : "No applications match your current filters. Try adjusting your search criteria."
            }
          </p>
          {applications.length === 0 && (
            <Link
              to="/jobs"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              Browse Jobs
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onUpdate={fetchApplications}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ApplicationCard({ application, onUpdate }) {
  const [showDetails, setShowDetails] = useState(false)
  const [showCredentialsForm, setShowCredentialsForm] = useState(false)
  
  const job = application.jobs
  const employer = application.employer_profile
  const hasCredentials = application.custom_responses && Object.keys(application.custom_responses).length > 0

  if (!job) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-4">
          <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-500">Job information not available</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          {employer?.company_logo_url ? (
            <img
              src={employer.company_logo_url}
              alt={employer.company_name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {job.title}
              </h3>
              {getStatusBadge(application.status)}
              {hasCredentials && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Credentials Complete
                </span>
              )}
            </div>
            
            <p className="text-gray-700 mb-2">{employer?.company_name || 'Unknown Company'}</p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-4 w-4 mr-1" />
                <span>Applied {timeAgo(application.created_at)}</span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span>{job.location || 'Remote'}</span>
              </div>
              {job.employment_type && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                  {job.employment_type.replace('-', ' ')}
                </span>
              )}
            </div>

            {(job.salary_min || job.salary_max) && (
              <div className="flex items-center text-sm text-gray-600">
                <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                <span>{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!hasCredentials && (
            <button
              onClick={() => setShowCredentialsForm(true)}
              className="flex items-center px-3 py-2 text-green-600 border border-green-300 rounded-lg hover:bg-green-50"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Credentials
            </button>
          )}
          
          {hasCredentials && (
            <button
              onClick={() => setShowCredentialsForm(true)}
              className="flex items-center px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit Credentials
            </button>
          )}
          
          <Link
            to="/messages"
            state={{ selectedApplicationId: application.id }}
            className="flex items-center px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
            Messages
          </Link>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {/* Credentials Form Modal */}
      <AnimatePresence>
        {showCredentialsForm && (
          <CredentialsForm
            application={application}
            onClose={() => setShowCredentialsForm(false)}
            onSuccess={() => {
              setShowCredentialsForm(false)
              onUpdate()
            }}
          />
        )}
      </AnimatePresence>

      {/* Expanded Details */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 pt-6 border-t border-gray-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Application Status Timeline */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Application Status</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Applied</p>
                    <p className="text-sm text-gray-500">{formatDate(application.created_at)}</p>
                  </div>
                </div>
                
                {application.viewed_at && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Viewed by Employer</p>
                      <p className="text-sm text-gray-500">{formatDate(application.viewed_at)}</p>
                    </div>
                  </div>
                )}
                
                {application.shortlisted_at && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Shortlisted</p>
                      <p className="text-sm text-gray-500">{formatDate(application.shortlisted_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Job Details */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Job Details</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Company:</span>
                  <span className="ml-2 text-gray-600">{employer?.company_name || 'Unknown'}</span>
                </div>
                {employer?.industry && (
                  <div>
                    <span className="font-medium text-gray-700">Industry:</span>
                    <span className="ml-2 text-gray-600">{employer.industry}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Location:</span>
                  <span className="ml-2 text-gray-600">{job.location || 'Remote'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Job Type:</span>
                  <span className="ml-2 text-gray-600 capitalize">
                    {job.employment_type?.replace('-', ' ') || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          {application.cover_letter && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Your Cover Letter</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {application.cover_letter}
                </p>
              </div>
            </div>
          )}

          {/* Submitted Credentials Summary */}
          {hasCredentials && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Submitted Credentials</h4>
              <CredentialsSummary credentials={application.custom_responses} />
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
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

function CredentialsForm({ application, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    documentUrl: '',
    documentTitle: ''
  })
  const [formData, setFormData] = useState({
    personal_info: {
      full_name: '',
      career_objectives: '',
      birthdate: '',
      address: '',
      contact_number: '',
      email: ''
    },
    education: {
      college_degree: '',
      year_graduated: '',
      school_attended: ''
    },
    work_experiences: [{
      position: '',
      previous_employer: '',
      duration: '',
      duties_responsibilities: ''
    }],
    documents: {
      resume_url: '',
      id_url: '',
      otr_url: '',
      diploma_url: ''
    }
  })
  
  const [uploadingFiles, setUploadingFiles] = useState({})

  // Load existing data if available
  useEffect(() => {
    if (application.custom_responses) {
      setFormData({
        personal_info: {
          full_name: '',
          career_objectives: '',
          birthdate: '',
          address: '',
          contact_number: '',
          email: '',
          ...application.custom_responses.personal_info
        },
        education: {
          college_degree: '',
          year_graduated: '',
          school_attended: '',
          ...application.custom_responses.education
        },
        work_experiences: application.custom_responses.work_experiences || [{
          position: '',
          previous_employer: '',
          duration: '',
          duties_responsibilities: ''
        }],
        documents: {
          resume_url: '',
          id_url: '',
          otr_url: '',
          diploma_url: '',
          ...application.custom_responses.documents
        }
      })
    }
  }, [application])

  const handleInputChange = (section, field, value, index = null) => {
    setFormData(prev => {
      if (section === 'work_experiences' && index !== null) {
        const newExperiences = [...prev.work_experiences]
        newExperiences[index] = { ...newExperiences[index], [field]: value }
        return { ...prev, work_experiences: newExperiences }
      }
      
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }
    })
  }

  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      work_experiences: [
        ...prev.work_experiences,
        {
          position: '',
          previous_employer: '',
          duration: '',
          duties_responsibilities: ''
        }
      ]
    }))
  }

  const removeWorkExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      work_experiences: prev.work_experiences.filter((_, i) => i !== index)
    }))
  }

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

  // Enhanced file upload function with auto-bucket creation
  const handleFileUpload = async (file, documentType) => {
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PDF, DOC, DOCX, JPG, or PNG files only')
      return
    }

    try {
      setUploadingFiles(prev => ({ ...prev, [documentType]: true }))
      
      console.log('🔍 Starting file upload process...')
      console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      })
      
      // Check if storage is properly configured
      console.log('🔍 Checking storage buckets...')
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        console.error('❌ Error listing buckets:', bucketsError)
        toast.error(`Storage access error: ${bucketsError.message}`)
        return
      }
      
      if (!buckets) {
        console.error('❌ No buckets data returned')
        toast.error('Storage not properly configured - no buckets found')
        return
      }
      
      console.log('📦 Available buckets:', buckets.map(b => ({ name: b.name, public: b.public })))
      
      let bucketExists = buckets.some(bucket => bucket.name === 'application-documents')
      
      // Auto-create bucket if it doesn't exist
      if (!bucketExists) {
        console.log('🔨 Attempting to create application-documents bucket automatically...')
        toast.loading('Creating storage bucket...')
        
        const { data: createData, error: createError } = await supabase.storage.createBucket('application-documents', {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: [
            'image/*', 
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ]
        })
        
        if (createError) {
          console.error('❌ Failed to create bucket automatically:', createError)
          
          // Handle RLS policy violation specifically
          if (createError.message?.includes('row-level security policy') || createError.message?.includes('policy')) {
            toast.error('Bucket creation requires admin privileges. Please create it manually!')
            
            // Show detailed instructions
            const instructions = `
📋 MANUAL BUCKET SETUP REQUIRED:

1. Go to your Supabase Dashboard
2. Navigate to Storage → New bucket
3. Bucket name: application-documents
4. ✅ Check "Public bucket"
5. File size limit: 50MB
6. Click "Create bucket"

After creating the bucket, try uploading again!
            `
            console.log(instructions)
            
            // Show user-friendly error with instructions
            toast.error('Please create the storage bucket manually in Supabase Dashboard', {
              duration: 8000
            })
            
            return
          } else {
            toast.error(`Failed to create storage bucket: ${createError.message}`)
            return
          }
        }
        
        console.log('✅ Bucket created successfully:', createData)
        toast.success('Storage bucket created successfully!')
        bucketExists = true
      }
      
      if (!bucketExists) {
        console.error('❌ application-documents bucket still not found after creation attempt')
        toast.error('Unable to create or access storage bucket. Please contact support.')
        return
      }
      
      console.log('✅ Bucket confirmed ready')
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const fileName = `${application.applicant_id}/${application.id}/${documentType}_${timestamp}.${fileExt}`
      
      console.log('📤 Uploading file with path:', fileName)
      
      // Upload file
      const { data, error } = await supabase.storage
        .from('application-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('❌ Storage upload error:', error)
        
        // Provide specific error messages based on error type
        let errorMessage = `Upload failed: ${error.message}`
        
        if (error.message?.includes('policy')) {
          errorMessage = 'Upload permission denied. The bucket was created but needs policies. Please set up RLS policies in Supabase dashboard.'
        } else if (error.message?.includes('size')) {
          errorMessage = 'File too large. Please use a smaller file.'
        } else if (error.message?.includes('bucket')) {
          errorMessage = 'Storage bucket configuration error. Please check bucket settings.'
        } else if (error.message?.includes('authenticated')) {
          errorMessage = 'Authentication required. Please log in again.'
        } else if (error.message?.includes('not allowed')) {
          errorMessage = 'Upload not allowed. Please contact support to configure storage policies.'
        }
        
        toast.error(errorMessage)
        return
      }

      console.log('✅ Upload successful:', data)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('application-documents')
        .getPublicUrl(fileName)

      if (!publicUrl) {
        console.error('❌ Failed to get public URL')
        toast.error('Failed to get file URL')
        return
      }

      console.log('🔗 Public URL generated:', publicUrl)

      // Update form data
      handleInputChange('documents', `${documentType}_url`, publicUrl)
      toast.success(`${documentType.toUpperCase()} uploaded successfully`)
      
      console.log('✅ File upload process completed successfully')
      
    } catch (error) {
      console.error('❌ Unexpected error during upload:', error)
      toast.error(`Unexpected error: ${error.message}`)
    } finally {
      setUploadingFiles(prev => ({ ...prev, [documentType]: false }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from(TABLES.APPLICATIONS || 'applications')
        .update({
          custom_responses: formData,
          applied_via: 'application_form',
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id)

      if (error) throw error

      toast.success('Credentials submitted successfully!')
      onSuccess()
      
    } catch (error) {
      console.error('Error submitting credentials:', error)
      toast.error('Failed to submit credentials')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    const { personal_info, education, documents } = formData
    return (
      personal_info.full_name &&
      personal_info.email &&
      personal_info.contact_number &&
      education.college_degree &&
      documents.resume_url &&
      documents.id_url
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {application.custom_responses ? 'Edit Credentials' : 'Submit Credentials'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div>
                <div className="flex items-center mb-4">
                  <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.personal_info.full_name}
                      onChange={(e) => handleInputChange('personal_info', 'full_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.personal_info.email}
                      onChange={(e) => handleInputChange('personal_info', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.personal_info.contact_number}
                      onChange={(e) => handleInputChange('personal_info', 'contact_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Birthdate
                    </label>
                    <input
                      type="date"
                      value={formData.personal_info.birthdate}
                      onChange={(e) => handleInputChange('personal_info', 'birthdate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.personal_info.address}
                      onChange={(e) => handleInputChange('personal_info', 'address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Career Objectives
                    </label>
                    <textarea
                      rows={3}
                      value={formData.personal_info.career_objectives}
                      onChange={(e) => handleInputChange('personal_info', 'career_objectives', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your career goals and objectives..."
                    />
                  </div>
                </div>
              </div>

              {/* Education */}
              <div>
                <div className="flex items-center mb-4">
                  <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      College Degree <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.education.college_degree}
                      onChange={(e) => handleInputChange('education', 'college_degree', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Bachelor of Science in Computer Science"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year Graduated
                    </label>
                    <input
                      type="number"
                      min="1950"
                      max={new Date().getFullYear()}
                      value={formData.education.year_graduated}
                      onChange={(e) => handleInputChange('education', 'year_graduated', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Attended
                    </label>
                    <input
                      type="text"
                      value={formData.education.school_attended}
                      onChange={(e) => handleInputChange('education', 'school_attended', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., University of the Philippines"
                    />
                  </div>
                </div>
              </div>

              {/* Work Experience */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <BriefcaseIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addWorkExperience}
                    className="flex items-center px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Experience
                  </button>
                </div>

                <div className="space-y-6">
                  {formData.work_experiences.map((experience, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Experience {index + 1}</h4>
                        {formData.work_experiences.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeWorkExperience(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Position
                          </label>
                          <input
                            type="text"
                            value={experience.position}
                            onChange={(e) => handleInputChange('work_experiences', 'position', e.target.value, index)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Previous Employer
                          </label>
                          <input
                            type="text"
                            value={experience.previous_employer}
                            onChange={(e) => handleInputChange('work_experiences', 'previous_employer', e.target.value, index)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration
                          </label>
                          <input
                            type="text"
                            value={experience.duration}
                            onChange={(e) => handleInputChange('work_experiences', 'duration', e.target.value, index)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 2 years, Jan 2020 - Dec 2021"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Actual Duties and Responsibilities
                          </label>
                          <textarea
                            rows={3}
                            value={experience.duties_responsibilities}
                            onChange={(e) => handleInputChange('work_experiences', 'duties_responsibilities', e.target.value, index)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Describe your key responsibilities and achievements..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents Upload */}
              <div>
                <div className="flex items-center mb-4">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'resume', label: 'Resume', required: true },
                    { key: 'id', label: 'Valid ID', required: true },
                    { key: 'otr', label: 'Official Transcript (OTR)', required: false },
                    { key: 'diploma', label: 'Diploma', required: false }
                  ].map(doc => (
                    <div key={doc.key} className="border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {doc.label} {doc.required && <span className="text-red-500">*</span>}
                      </label>
                      
                      {formData.documents[`${doc.key}_url`] ? (
                        <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center">
                            <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                            <span className="text-sm text-green-800">Uploaded</span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => openDocumentViewer(
                                formData.documents[`${doc.key}_url`],
                                doc.label
                              )}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View
                            </button>
                            <label className="text-sm text-blue-600 hover:underline cursor-pointer">
                              Replace
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileUpload(e.target.files[0], doc.key)}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-2 pb-3">
                            {uploadingFiles[doc.key] ? (
                              <div className="text-sm text-gray-500">Uploading...</div>
                            ) : (
                              <>
                                <CloudArrowUpIcon className="w-6 h-6 mb-1 text-gray-400" />
                                <p className="text-xs text-gray-500">Click to upload {doc.label}</p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e.target.files[0], doc.key)}
                            disabled={uploadingFiles[doc.key]}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Credentials'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
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

function CredentialsSummary({ credentials }) {
  const { personal_info, education, work_experiences, documents } = credentials

  const completedSections = [
    personal_info && Object.values(personal_info).some(Boolean),
    education && Object.values(education).some(Boolean),
    work_experiences && work_experiences.length > 0,
    documents && Object.values(documents).some(Boolean)
  ].filter(Boolean).length

  const uploadedDocuments = documents ? Object.values(documents).filter(Boolean).length : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center">
          <CheckIcon className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-blue-900">Sections Completed</p>
            <p className="text-lg font-semibold text-blue-600">{completedSections}/4</p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 rounded-lg p-4">
        <div className="flex items-center">
          <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-green-900">Documents Uploaded</p>
            <p className="text-lg font-semibold text-green-600">{uploadedDocuments}</p>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 rounded-lg p-4">
        <div className="flex items-center">
          <BriefcaseIcon className="h-5 w-5 text-purple-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-purple-900">Work Experience</p>
            <p className="text-lg font-semibold text-purple-600">
              {work_experiences ? work_experiences.length : 0} position{work_experiences?.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApplicationsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="flex space-x-3">
            <div className="h-10 bg-gray-200 rounded w-20"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-64 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-40"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-10 w-20 bg-gray-200 rounded"></div>
                  <div className="h-10 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}