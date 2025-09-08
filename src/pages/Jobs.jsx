// src/pages/Jobs.jsx - Enhanced version with improved UX and performance
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { 
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  HeartIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  TagIcon,
  EyeIcon,
  StarIcon,
  ClockIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import { supabase, TABLES, SWIPE_ACTIONS, USER_ROLES } from '../lib/supabase'
import { formatSalary, formatDate, calculateMatchScore, timeAgo } from '../lib/utils'
import { JOB_CATEGORIES } from '../lib/constants'

export default function Jobs() {
  const { profile } = useAuth()
  const [jobs, setJobs] = useState([])
  const [currentJobIndex, setCurrentJobIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savedJobs, setSavedJobs] = useState(new Set())
  const [filters, setFilters] = useState({
    location: '',
    employment_type: '',
    salary_min: '',
    remote_only: false,
    category: '',
    experience_min: '',
    experience_max: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState(null)

  // Memoized current job to prevent unnecessary re-renders
  const currentJob = useMemo(() => jobs[currentJobIndex], [jobs, currentJobIndex])

  useEffect(() => {
    if (profile?.id) {
      fetchJobs()
      fetchSavedJobs()
    }
  }, [profile?.id, filters])

  const fetchSavedJobs = useCallback(async () => {
    if (!profile?.id) return

    try {
      const { data, error } = await supabase
        .from(TABLES.SAVED_ITEMS || 'saved_items')
        .select('item_id')
        .eq('user_id', profile.id)
        .eq('item_type', 'job')

      if (!error && data) {
        setSavedJobs(new Set(data.map(item => item.item_id)))
      }
    } catch (err) {
      console.warn('Error fetching saved jobs:', err)
    }
  }, [profile?.id])

  const fetchJobs = useCallback(async () => {
    if (!profile?.id) return

    try {
      setLoading(true)
      setError(null)
      
      // Build query with filters - get jobs first
      let query = supabase
        .from(TABLES.JOBS || 'jobs')
        .select('*')
        
      // Show different statuses based on user role
      if (profile.role === USER_ROLES.EMPLOYER) {
        // Employers can see their own jobs regardless of status
        query = query.in('status', ['active', 'pending_approval', 'draft'])
      } else {
        // Job seekers only see active jobs
        query = query.eq('status', 'active')
      }
      
      query = query.order('created_at', { ascending: false })

      // Apply filters
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`)
      }
      if (filters.employment_type) {
        query = query.eq('employment_type', filters.employment_type)
      }
      if (filters.salary_min) {
        query = query.gte('salary_min', parseInt(filters.salary_min))
      }
      if (filters.remote_only) {
        query = query.eq('is_remote', true)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.experience_min) {
        query = query.gte('experience_required_min', parseInt(filters.experience_min))
      }
      if (filters.experience_max) {
        query = query.lte('experience_required_max', parseInt(filters.experience_max))
      }

      const { data: jobsData, error: jobsError } = await query.limit(50)

      if (jobsError) {
        throw jobsError
      }

      if (!jobsData || jobsData.length === 0) {
        setJobs([])
        return
      }

      // Get employer profiles separately
      const employerIds = [...new Set(jobsData.map(job => job.employer_id))]

      const { data: employerData, error: employerError } = await supabase
        .from('employer_profiles')
        .select(`
          user_id,
          company_name,
          company_logo_url,
          industry,
          company_description,
          company_size,
          website_url
        `)
        .in('user_id', employerIds)

      if (employerError) {
        console.warn('Employer profiles query error (non-critical):', employerError)
      }

      // Merge job and employer data
      let mergedJobs = jobsData.map(job => {
        const employerProfile = employerData?.find(emp => emp.user_id === job.employer_id)
        return {
          ...job,
          employer_profiles: employerProfile || {
            company_name: 'Company Name Not Available',
            company_logo_url: null,
            industry: 'Industry Not Specified',
            company_description: 'Company description not available',
            company_size: null,
            website_url: null
          }
        }
      })

      // Filter out swiped jobs for job seekers
      if (profile.role === USER_ROLES.JOB_SEEKER) {
        try {
          const { data: swipedJobs } = await supabase
            .from(TABLES.SWIPES || 'swipes')
            .select('target_id')
            .eq('swiper_id', profile.id)
            .eq('target_type', 'job')

          if (swipedJobs) {
            const swipedJobIds = swipedJobs.map(swipe => swipe.target_id)
            mergedJobs = mergedJobs.filter(job => !swipedJobIds.includes(job.id))
          }
        } catch (swipeErr) {
          console.warn('Error fetching swipes:', swipeErr)
        }
      }

      // Calculate match scores for job seekers
      if (profile.role === USER_ROLES.JOB_SEEKER && profile.job_seeker_profiles?.[0]) {
        const jobSeekerProfile = profile.job_seeker_profiles[0]
        const jobsWithScores = mergedJobs.map(job => ({
          ...job,
          match_score: calculateMatchScore(jobSeekerProfile, job)
        }))
        
        // Sort by match score
        jobsWithScores.sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
        setJobs(jobsWithScores)
      } else {
        setJobs(mergedJobs)
      }
      
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError(error.message || 'Failed to load jobs')
      toast.error(`Failed to load jobs: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [profile, filters])

  const handleSwipe = useCallback(async (action, jobId = null) => {
    const job = jobId ? jobs.find(j => j.id === jobId) : currentJob
    if (!job) return

    try {
      setSwipeDirection(action === SWIPE_ACTIONS.LIKE ? 'right' : 'left')
      
      // Record swipe action
      const { error: swipeError } = await supabase
        .from(TABLES.SWIPES || 'swipes')
        .insert([{
          swiper_id: profile.id,
          target_type: 'job',
          target_id: job.id,
          action
        }])

      if (swipeError) throw swipeError

      if (action === SWIPE_ACTIONS.LIKE || action === SWIPE_ACTIONS.SUPERLIKE) {
        // Create job application
        const { data: applicationData, error: applicationError } = await supabase
          .from(TABLES.APPLICATIONS || 'applications')
          .insert([{
            applicant_id: profile.id,
            job_id: job.id,
            employer_id: job.employer_id,
            status: 'applied',
            applied_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (applicationError && applicationError.code !== '23505') {
          // 23505 is unique constraint violation (already applied)
          throw applicationError
        }

        // Start conversation if application was created successfully
        if (applicationData) {
          try {
            // Generate conversation ID
            const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2)}`
            
            // Create initial message from job seeker to employer
            const { error: messageError } = await supabase
              .from(TABLES.MESSAGES || 'messages')
              .insert([{
                conversation_id: conversationId,
                sender_id: profile.id,
                recipient_id: job.employer_id,
                job_id: job.id,
                application_id: applicationData.id,
                content: `Hi! I just applied for the ${job.title} position at ${job.employer_profiles?.company_name || 'your company'}. I'm very interested in this opportunity and would love to learn more about the role. Thank you for considering my application!`,
                type: 'text'
              }])

            if (messageError) {
              console.warn('Could not create initial message:', messageError)
              // Don't throw error as application was successful
            }
          } catch (conversationError) {
            console.warn('Error creating conversation:', conversationError)
            // Don't throw error as application was successful
          }
        }

        toast.success('Applied to job successfully!')
        
        // Auto-save liked jobs
        if (!savedJobs.has(job.id)) {
          await saveJob(job.id, false) // Silent save
        }
      }

      // Move to next job with animation delay
      setTimeout(() => {
        setCurrentJobIndex(prev => prev + 1)
        setSwipeDirection(null)
      }, 300)
      
    } catch (error) {
      console.error('Error swiping:', error)
      
      if (error.code === '23505') {
        toast.error('You have already applied to this job!')
      } else {
        toast.error('Failed to process application')
      }
      
      setSwipeDirection(null)
    }
  }, [currentJob, jobs, profile.id, savedJobs])

  const saveJob = useCallback(async (jobId, showToast = true) => {
    try {
      if (savedJobs.has(jobId)) {
        // Unsave job
        const { error } = await supabase
          .from(TABLES.SAVED_ITEMS || 'saved_items')
          .delete()
          .eq('user_id', profile.id)
          .eq('item_type', 'job')
          .eq('item_id', jobId)

        if (error) throw error

        setSavedJobs(prev => {
          const newSet = new Set(prev)
          newSet.delete(jobId)
          return newSet
        })
        
        if (showToast) toast.success('Job removed from saved')
      } else {
        // Save job
        const { error } = await supabase
          .from(TABLES.SAVED_ITEMS || 'saved_items')
          .insert([{
            user_id: profile.id,
            item_type: 'job',
            item_id: jobId
          }])

        if (error) throw error

        setSavedJobs(prev => new Set([...prev, jobId]))
        if (showToast) toast.success('Job saved!')
      }
    } catch (error) {
      console.error('Error saving job:', error)
      if (showToast) toast.error('Failed to save job')
    }
  }, [profile.id, savedJobs])

  const resetFiltersAndJobs = useCallback(() => {
    setFilters({
      location: '',
      employment_type: '',
      salary_min: '',
      remote_only: false,
      category: '',
      experience_min: '',
      experience_max: ''
    })
    setCurrentJobIndex(0)
  }, [])

  const goToPreviousJob = useCallback(() => {
    if (currentJobIndex > 0) {
      setCurrentJobIndex(prev => prev - 1)
    }
  }, [currentJobIndex])

  const hasMoreJobs = currentJobIndex < jobs.length
  const hasPreviousJobs = currentJobIndex > 0

  if (!profile) {
    return <JobsSkeleton />
  }

  if (loading) {
    return <JobsSkeleton />
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Jobs
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchJobs}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Find Jobs - JobFinder</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Find Jobs</h1>
          <p className="mt-2 text-gray-600">
            Discover opportunities that match your skills
          </p>
          {jobs.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Showing {jobs.length} jobs • Job {currentJobIndex + 1} of {jobs.length}
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
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            Filters
            {Object.values(filters).some(v => v) && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                {Object.values(filters).filter(v => v).length}
              </span>
            )}
          </button>
          {profile.role === USER_ROLES.EMPLOYER && (
            <Link
              to="/post-job"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Post Job
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FiltersComponent 
              filters={filters} 
              setFilters={setFilters}
              onReset={resetFiltersAndJobs}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job Cards */}
      <div className="flex justify-center relative">
        {hasMoreJobs ? (
          <SwipeCard
            job={currentJob}
            onSwipe={handleSwipe}
            onSave={saveJob}
            profile={profile}
            isSaved={savedJobs.has(currentJob?.id)}
            swipeDirection={swipeDirection}
          />
        ) : jobs.length === 0 ? (
          <NoJobsFoundComponent onReset={resetFiltersAndJobs} />
        ) : (
          <NoMoreJobsComponent onReset={resetFiltersAndJobs} />
        )}

        {/* Navigation Buttons */}
        {hasPreviousJobs && (
          <button
            onClick={goToPreviousJob}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 h-12 w-12 bg-white border-2 border-gray-300 text-gray-600 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-all z-10"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Progress Indicator */}
      {hasMoreJobs && (
        <ProgressIndicator 
          currentIndex={currentJobIndex} 
          total={jobs.length}
          onJumpTo={(index) => setCurrentJobIndex(index)}
        />
      )}

      {/* Quick Actions */}
      {hasMoreJobs && (
        <div className="flex justify-center mt-8 space-x-4">
          <button
            onClick={() => handleSwipe(SWIPE_ACTIONS.PASS)}
            className="px-6 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            Pass
          </button>
          <button
            onClick={() => saveJob(currentJob?.id)}
            className={`px-6 py-3 border rounded-lg transition-colors ${
              savedJobs.has(currentJob?.id)
                ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                : 'bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100'
            }`}
          >
            {savedJobs.has(currentJob?.id) ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={() => handleSwipe(SWIPE_ACTIONS.LIKE)}
            className="px-6 py-3 bg-green-50 border border-green-200 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}

function FiltersComponent({ filters, setFilters, onReset }) {
  const hasActiveFilters = Object.values(filters).some(v => v)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filter Jobs</h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {JOB_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Enter location"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Type
          </label>
          <select
            value={filters.employment_type}
            onChange={(e) => setFilters(prev => ({ ...prev, employment_type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Salary
          </label>
          <input
            type="number"
            value={filters.salary_min}
            onChange={(e) => setFilters(prev => ({ ...prev, salary_min: e.target.value }))}
            placeholder="Minimum salary"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Experience
          </label>
          <select
            value={filters.experience_min}
            onChange={(e) => setFilters(prev => ({ ...prev, experience_min: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any</option>
            <option value="0">Entry Level</option>
            <option value="1">1+ years</option>
            <option value="3">3+ years</option>
            <option value="5">5+ years</option>
            <option value="10">10+ years</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Experience
          </label>
          <select
            value={filters.experience_max}
            onChange={(e) => setFilters(prev => ({ ...prev, experience_max: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any</option>
            <option value="2">Up to 2 years</option>
            <option value="5">Up to 5 years</option>
            <option value="10">Up to 10 years</option>
            <option value="15">Up to 15 years</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.remote_only}
              onChange={(e) => setFilters(prev => ({ ...prev, remote_only: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Remote only</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function NoJobsFoundComponent({ onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16"
    >
      <BuildingOfficeIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No jobs found
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        We couldn't find any jobs matching your criteria. Try adjusting your filters or check back later for new opportunities.
      </p>
      <button
        onClick={onReset}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Reset Filters & Try Again
      </button>
    </motion.div>
  )
}

function NoMoreJobsComponent({ onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16"
    >
      <BuildingOfficeIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No more jobs available
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        You've reviewed all available jobs matching your criteria. Try adjusting your filters or check back later for new opportunities.
      </p>
      <div className="space-y-3">
        <button
          onClick={onReset}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reset Filters & Start Over
        </button>
        <div>
          <Link
            to="/profile"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Update your profile for better matches
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

function ProgressIndicator({ currentIndex, total, onJumpTo }) {
  return (
    <div className="mt-8 text-center">
      <p className="text-sm text-gray-500 mb-2">
        Job {currentIndex + 1} of {total}
      </p>
      <div className="w-64 mx-auto bg-gray-200 rounded-full h-2 relative">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
        
        {/* Clickable segments for navigation */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: Math.min(total, 10) }).map((_, index) => {
            const segmentIndex = Math.floor((index / 10) * total)
            return (
              <button
                key={index}
                onClick={() => onJumpTo(segmentIndex)}
                className="flex-1 h-full opacity-0 hover:opacity-20 hover:bg-blue-400 transition-opacity"
                title={`Go to job ${segmentIndex + 1}`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SwipeCard({ job, onSwipe, onSave, profile, isSaved, swipeDirection }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      onSwipe(SWIPE_ACTIONS.LIKE)
    } else if (info.offset.x < -100) {
      onSwipe(SWIPE_ACTIONS.PASS)
    }
  }

  const handleMediaNavigation = (direction) => {
    if (mediaItems.length <= 1) return
    
    if (direction === 'next') {
      setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length)
    } else {
      setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)
    }
  }

  const toggleVideoPlayback = () => {
    setIsVideoPlaying(!isVideoPlaying)
  }

  if (!job) return null

  // Prepare media array
  const mediaItems = []
  
  // Add company logo
  if (job.employer_profiles?.company_logo_url) {
    mediaItems.push({
      type: 'image',
      url: job.employer_profiles.company_logo_url,
      alt: `${job.employer_profiles?.company_name} logo`
    })
  }

  // Add job media
  if (job.media_urls?.length > 0) {
    job.media_urls.forEach(mediaUrl => {
      const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl)
      mediaItems.push({
        type: isVideo ? 'video' : 'image',
        url: mediaUrl,
        alt: `${job.title} media`
      })
    })
  }

  // Add workplace images
  if (job.workplace_images?.length > 0) {
    job.workplace_images.forEach(imageUrl => {
      mediaItems.push({
        type: 'image',
        url: imageUrl,
        alt: `${job.employer_profiles?.company_name} workplace`
      })
    })
  }

  const currentMedia = mediaItems[currentMediaIndex]
  const hasMultipleMedia = mediaItems.length > 1

  return (
    <div className="relative w-full max-w-md mx-auto">
      <motion.div
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        animate={swipeDirection ? {
          x: swipeDirection === 'right' ? 300 : -300,
          opacity: 0
        } : {}}
        transition={{ duration: 0.3 }}
      >
        {/* Media Section */}
        <div className="relative h-80 bg-gradient-to-br from-gray-100 to-gray-200">
          {currentMedia ? (
            currentMedia.type === 'video' ? (
              <div className="relative w-full h-full">
                <video
                  className="w-full h-full object-cover"
                  autoPlay={isVideoPlaying}
                  muted
                  loop
                  playsInline
                >
                  <source src={currentMedia.url} type="video/mp4" />
                </video>
                <button
                  onClick={toggleVideoPlayback}
                  className="absolute bottom-4 left-4 h-10 w-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  {isVideoPlaying ? (
                    <PauseIcon className="h-5 w-5" />
                  ) : (
                    <PlayIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            ) : (
              <img
                src={currentMedia.url}
                alt={currentMedia.alt}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
              <div className="text-center">
                <BuildingOfficeIcon className="mx-auto h-16 w-16 text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm font-medium">
                  {job.employer_profiles?.company_name || 'Company'}
                </p>
              </div>
            </div>
          )}

          {/* Media Navigation */}
          {hasMultipleMedia && (
            <>
              <button
                onClick={() => handleMediaNavigation('prev')}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleMediaNavigation('next')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <ArrowRightIcon className="h-4 w-4" />
              </button>
              
              {/* Media dots */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {mediaItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMediaIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Match Score */}
          {job.match_score && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
              <StarIcon className={`h-4 w-4 ${getMatchScoreColor(job.match_score)}`} />
              <span className={`text-sm font-bold ${getMatchScoreColor(job.match_score)}`}>
                {job.match_score}%
              </span>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={() => onSave(job.id)}
            className="absolute top-4 left-4 h-10 w-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            {isSaved ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* Job Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
            <h2 className="text-2xl font-bold text-white mb-1 line-clamp-2">{job.title}</h2>
            <p className="text-lg text-white/90 mb-1">
              {job.employer_profiles?.company_name || 'Unknown Company'}
            </p>
            {job.employer_profiles?.industry && (
              <p className="text-sm text-white/70">{job.employer_profiles.industry}</p>
            )}
            {job.employer_profiles?.company_size && (
              <p className="text-xs text-white/60 mt-1">
                {job.employer_profiles.company_size} employees
              </p>
            )}
          </div>
        </div>

        {/* Job Details */}
        <div className="p-6 space-y-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {job.status !== 'active' && (
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                job.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                job.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {job.status === 'pending_approval' ? 'Pending' : 
                 job.status === 'draft' ? 'Draft' : job.status}
              </span>
            )}
            {job.category && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                {job.category}
              </span>
            )}
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium capitalize">
              {job.employment_type?.replace('-', ' ')}
            </span>
            {job.is_remote && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                Remote
              </span>
            )}
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{job.location || 'Remote'}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <CurrencyDollarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">
                {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
              </span>
            </div>
            {job.experience_required_min !== null && (
              <div className="flex items-center text-gray-600">
                <ClockIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">
                  {job.experience_required_min}+ years exp
                </span>
              </div>
            )}
            <div className="flex items-center text-gray-600">
              <CalendarDaysIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{timeAgo(job.created_at)}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
              {job.description}
            </p>
          </div>

          {/* Skills */}
          {job.skills_required?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Required Skills</h4>
              <div className="flex flex-wrap gap-1">
                {job.skills_required.slice(0, 6).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {skill}
                  </span>
                ))}
                {job.skills_required.length > 6 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                    +{job.skills_required.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Benefits */}
          {job.benefits?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Benefits</h4>
              <div className="flex flex-wrap gap-1">
                {job.benefits.slice(0, 3).map((benefit, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded"
                  >
                    {benefit}
                  </span>
                ))}
                {job.benefits.length > 3 && (
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded">
                    +{job.benefits.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex items-center justify-center space-x-4">
          <motion.button
            onClick={() => onSwipe(SWIPE_ACTIONS.PASS)}
            className="h-14 w-14 bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-600 rounded-full flex items-center justify-center transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <XMarkIcon className="h-6 w-6" />
          </motion.button>

          <motion.button
            onClick={() => onSave(job.id)}
            className={`h-12 w-12 border-2 rounded-full flex items-center justify-center transition-all duration-200 ${
              isSaved 
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSaved ? (
              <HeartSolidIcon className="h-5 w-5" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
          </motion.button>

          <motion.button
            onClick={() => onSwipe(SWIPE_ACTIONS.LIKE)}
            className="h-14 w-14 bg-green-50 hover:bg-green-100 border-2 border-green-200 text-green-600 rounded-full flex items-center justify-center transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CheckIcon className="h-6 w-6" />
          </motion.button>
        </div>
      </motion.div>

      {/* Swipe Indicators */}
      <motion.div
        className="absolute top-20 left-8 px-6 py-3 bg-red-500 text-white rounded-lg font-bold text-xl transform -rotate-12 shadow-lg pointer-events-none"
        style={{ opacity: useTransform(x, [-200, -50, 0], [1, 0, 0]) }}
      >
        PASS
      </motion.div>
      <motion.div
        className="absolute top-20 right-8 px-6 py-3 bg-green-500 text-white rounded-lg font-bold text-xl transform rotate-12 shadow-lg pointer-events-none"
        style={{ opacity: useTransform(x, [0, 50, 200], [0, 0, 1]) }}
      >
        APPLY
      </motion.div>
    </div>
  )
}

// Helper function for match score colors
function getMatchScoreColor(score) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

// Loading skeleton component
function JobsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="flex space-x-3">
            <div className="h-10 bg-gray-200 rounded w-20"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        
        {/* Card skeleton */}
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="h-80 bg-gray-200"></div>
          
          <div className="p-6 space-y-4">
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              <div className="h-6 bg-gray-200 rounded-full w-14"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
            
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="flex gap-1">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-14"></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="flex gap-1">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-200 rounded w-18"></div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4">
              <div className="h-14 w-14 bg-gray-200 rounded-full"></div>
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="h-14 w-14 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Progress indicator skeleton */}
        <div className="mt-8 text-center">
          <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
          <div className="w-64 mx-auto bg-gray-200 rounded-full h-2"></div>
        </div>
      </div>
    </div>
  )
}