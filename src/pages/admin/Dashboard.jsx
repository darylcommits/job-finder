// src/pages/admin/AdminDashboard.jsx - Enhanced version with improved design
import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UsersIcon,
  BriefcaseIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon,
  XMarkIcon,
  CheckIcon,
  ShieldExclamationIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  PlayIcon,
  ArrowPathIcon,
  SparklesIcon,
  FireIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

import { useAuth } from '../../contexts/AuthContext'
import { supabase, TABLES, USER_ROLES } from '../../lib/supabase'
import { formatDate, timeAgo } from '../../lib/utils'

function AdminDashboard() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, new_this_week: 0, trend: 0 },
    jobs: { total: 0, active: 0, pending: 0, trend: 0 },
    applications: { total: 0, this_week: 0, trend: 0 },
    employers: { total: 0, verified: 0, unverified: 0, trend: 0 }
  })
  const [pendingJobs, setPendingJobs] = useState([])
  const [unverifiedEmployers, setUnverifiedEmployers] = useState([])
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    if (profile?.role === USER_ROLES.ADMIN) {
      fetchDashboardData()
    }
  }, [profile])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching admin dashboard data...')

      // Fetch all data concurrently
      const [
        usersData,
        jobsData,
        pendingJobsData,
        unverifiedEmployersData
      ] = await Promise.all([
        fetchUsersData(),
        fetchJobsData(),
        fetchPendingJobs(),
        fetchUnverifiedEmployers()
      ])

      // Calculate statistics
      calculateStats(usersData, jobsData)
      setPendingJobs(pendingJobsData)
      setUnverifiedEmployers(unverifiedEmployersData)

      // Generate recent activity
      generateRecentActivity(usersData, jobsData)

      console.log('✅ Dashboard data loaded successfully')

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsersData = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select(`
          id, role, created_at, is_active, is_verified, last_active,
          employer_profiles (company_name)
        `)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching users:', error)
      return []
    }
  }

  const fetchJobsData = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.JOBS)
        .select('id, status, created_at, views_count, applications_count')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching jobs:', error)
      return []
    }
  }

  const fetchPendingJobs = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.JOBS)
        .select(`
          id, title, created_at, media_urls, workplace_images,
          employer_profiles!jobs_employer_id_fkey (
            company_name, company_logo_url
          )
        `)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: true })
        .limit(5)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching pending jobs:', error)
      return []
    }
  }

  const fetchUnverifiedEmployers = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select(`
          id, full_name, created_at, email,
          employer_profiles (
            company_name, industry, company_size
          )
        `)
        .eq('role', USER_ROLES.EMPLOYER)
        .eq('is_verified', false)
        .order('created_at', { ascending: true })
        .limit(5)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching unverified employers:', error)
      return []
    }
  }

  const calculateStats = (users, jobs) => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // User statistics
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.is_active).length
    const newUsersThisWeek = users.filter(u => new Date(u.created_at) > weekAgo).length
    const newUsersLastWeek = users.filter(u => 
      new Date(u.created_at) > twoWeeksAgo && new Date(u.created_at) <= weekAgo
    ).length

    // Job statistics
    const totalJobs = jobs.length
    const activeJobs = jobs.filter(j => j.status === 'active').length
    const pendingJobsCount = jobs.filter(j => j.status === 'pending_approval').length
    const newJobsThisWeek = jobs.filter(j => new Date(j.created_at) > weekAgo).length
    const newJobsLastWeek = jobs.filter(j => 
      new Date(j.created_at) > twoWeeksAgo && new Date(j.created_at) <= weekAgo
    ).length

    // Employer statistics
    const employers = users.filter(u => u.role === USER_ROLES.EMPLOYER)
    const totalEmployers = employers.length
    const verifiedEmployers = employers.filter(e => e.is_verified).length
    const unverifiedEmployersCount = employers.filter(e => !e.is_verified).length

    // Calculate trends
    const userTrend = newUsersLastWeek === 0 ? 100 : 
      ((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100
    const jobTrend = newJobsLastWeek === 0 ? 100 : 
      ((newJobsThisWeek - newJobsLastWeek) / newJobsLastWeek) * 100

    setStats({
      users: { 
        total: totalUsers, 
        active: activeUsers, 
        new_this_week: newUsersThisWeek, 
        trend: userTrend 
      },
      jobs: { 
        total: totalJobs, 
        active: activeJobs, 
        pending: pendingJobsCount, 
        trend: jobTrend 
      },
      applications: { 
        total: jobs.reduce((sum, job) => sum + (job.applications_count || 0), 0), 
        this_week: 0, // This would need swipes data to calculate properly
        trend: 0 
      },
      employers: { 
        total: totalEmployers, 
        verified: verifiedEmployers, 
        unverified: unverifiedEmployersCount,
        trend: 0 
      }
    })
  }

  const generateRecentActivity = (users, jobs) => {
    const activities = []

    // Recent users (last 10)
    users
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .forEach(user => {
        activities.push({
          type: 'user_registered',
          id: user.id,
          title: `New ${user.role.replace('_', ' ')} registered`,
          subtitle: user.employer_profiles?.[0]?.company_name || user.full_name || user.email,
          created_at: user.created_at,
          status: user.is_verified ? 'verified' : 'unverified'
        })
      })

    // Recent jobs (last 10)
    jobs
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .forEach(job => {
        activities.push({
          type: 'job_posted',
          id: job.id,
          title: `Job posted`,
          subtitle: `${job.views_count || 0} views, ${job.applications_count || 0} applications`,
          created_at: job.created_at,
          status: job.status
        })
      })

    // Sort all activities by date and take top 10
    const sortedActivities = activities
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)

    setRecentActivity(sortedActivities)
  }

  const handleQuickJobAction = async (jobId, action) => {
    try {
      setRefreshing(true)

      const updates = {
        status: action,
        updated_at: new Date().toISOString()
      }

      if (action === 'active') {
        updates.approved_at = new Date().toISOString()
        updates.approved_by = profile.id
      }

      const { error } = await supabase
        .from(TABLES.JOBS)
        .update(updates)
        .eq('id', jobId)

      if (error) throw error

      // Remove from pending list
      setPendingJobs(prev => prev.filter(job => job.id !== jobId))

      // Update stats
      setStats(prev => ({
        ...prev,
        jobs: {
          ...prev.jobs,
          pending: prev.jobs.pending - 1,
          active: action === 'active' ? prev.jobs.active + 1 : prev.jobs.active
        }
      }))

      toast.success(
        action === 'active' 
          ? 'Job approved successfully!' 
          : 'Job rejected'
      )

    } catch (error) {
      console.error('Error updating job:', error)
      toast.error('Failed to update job')
    } finally {
      setRefreshing(false)
    }
  }

  const handleQuickEmployerAction = async (employerId, action) => {
    try {
      setRefreshing(true)

      const { error } = await supabase
        .from(TABLES.PROFILES)
        .update({ is_verified: action === 'verify' })
        .eq('id', employerId)

      if (error) throw error

      // Remove from unverified list if verified
      if (action === 'verify') {
        setUnverifiedEmployers(prev => prev.filter(emp => emp.id !== employerId))
        
        // Update stats
        setStats(prev => ({
          ...prev,
          employers: {
            ...prev.employers,
            verified: prev.employers.verified + 1,
            unverified: prev.employers.unverified - 1
          }
        }))
      }

      toast.success(
        action === 'verify' 
          ? 'Employer verified successfully!' 
          : 'Employer verification removed'
      )

    } catch (error) {
      console.error('Error updating employer:', error)
      toast.error('Failed to update employer')
    } finally {
      setRefreshing(false)
    }
  }

  const refreshDashboard = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
    toast.success('Dashboard refreshed!')
  }

  if (loading) {
    return <AdminDashboardSkeleton />
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <Helmet>
        <title>Admin Dashboard - JobFinder</title>
      </Helmet>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"
            >
              <SparklesIcon className="h-6 w-6 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Monitor and manage your job platform with real-time insights
          </p>
        </div>
        <motion.button
          onClick={refreshDashboard}
          disabled={refreshing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: "linear" }}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
          </motion.div>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </motion.button>
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <StatCard
          title="Total Users"
          value={stats.users.total}
          subtitle={`${stats.users.active} active`}
          trend={stats.users.trend}
          icon={UsersIcon}
          color="blue"
          link="/admin/users"
          delay={0}
        />
        <StatCard
          title="Jobs Posted"
          value={stats.jobs.total}
          subtitle={`${stats.jobs.pending} pending approval`}
          trend={stats.jobs.trend}
          icon={BriefcaseIcon}
          color="green"
          link="/admin/jobs"
          highlight={stats.jobs.pending > 0}
          delay={0.1}
        />
        <StatCard
          title="Applications"
          value={stats.applications.total}
          subtitle={`${stats.applications.this_week} this week`}
          trend={stats.applications.trend}
          icon={ChartBarIcon}
          color="purple"
          link="/admin/analytics"
          delay={0.2}
        />
        <StatCard
          title="Employers"
          value={stats.employers.total}
          subtitle={`${stats.employers.unverified} unverified`}
          trend={stats.employers.trend}
          icon={BuildingOfficeIcon}
          color="orange"
          link="/admin/users?filter=employer"
          highlight={stats.employers.unverified > 0}
          delay={0.3}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Jobs */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    <ClockIcon className="h-5 w-5 text-orange-500 mr-2" />
                  </motion.div>
                  Pending Job Approvals 
                  <motion.span 
                    key={stats.jobs.pending}
                    initial={{ scale: 1.5, color: '#f59e0b' }}
                    animate={{ scale: 1, color: '#6b7280' }}
                    className="ml-2 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium"
                  >
                    {stats.jobs.pending}
                  </motion.span>
                </h2>
                <Link
                  to="/admin/jobs?filter=pending_approval"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              <AnimatePresence>
                {pendingJobs.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-8 text-center text-gray-500"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-3" />
                    </motion.div>
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm">No pending job approvals at the moment.</p>
                  </motion.div>
                ) : (
                  pendingJobs.map((job, index) => (
                    <motion.div 
                      key={job.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-base font-semibold text-gray-900">{job.title}</h3>
                            {(job.media_urls?.length > 0 || job.workplace_images?.length > 0) && (
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                {job.media_urls?.length > 0 && (
                                  <motion.div 
                                    whileHover={{ scale: 1.1 }}
                                    className="flex items-center bg-blue-100 text-blue-600 px-2 py-1 rounded-full"
                                  >
                                    <PhotoIcon className="h-3 w-3 mr-1" />
                                    {job.media_urls.length}
                                  </motion.div>
                                )}
                                {job.workplace_images?.length > 0 && (
                                  <motion.div 
                                    whileHover={{ scale: 1.1 }}
                                    className="flex items-center bg-green-100 text-green-600 px-2 py-1 rounded-full"
                                  >
                                    <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                                    {job.workplace_images.length}
                                  </motion.div>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">{job.employer_profiles?.company_name || 'Unknown Company'}</span> • {timeAgo(job.created_at)}
                          </p>
                          
                          {/* Enhanced Media preview */}
                          {job.media_urls?.length > 0 && (
                            <div className="flex space-x-3 mb-3">
                              {job.media_urls.slice(0, 3).map((url, mediaIndex) => {
                                const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url)
                                return (
                                  <motion.div 
                                    key={mediaIndex}
                                    whileHover={{ scale: 1.05 }}
                                    className="w-16 h-16 rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm"
                                  >
                                    {isVideo ? (
                                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                                        <PlayIcon className="h-6 w-6 text-purple-600" />
                                      </div>
                                    ) : (
                                      <img
                                        src={url}
                                        alt={`Job media ${mediaIndex + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = 'none'
                                        }}
                                      />
                                    )}
                                  </motion.div>
                                )
                              })}
                              {job.media_urls.length > 3 && (
                                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                                  <span className="text-sm text-gray-500 font-medium">+{job.media_urls.length - 3}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2 ml-6">
                          <motion.button
                            onClick={() => handleQuickJobAction(job.id, 'active')}
                            disabled={refreshing}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 shadow-md"
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Approve
                          </motion.button>
                          <motion.button
                            onClick={() => handleQuickJobAction(job.id, 'rejected')}
                            disabled={refreshing}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 shadow-md"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Reject
                          </motion.button>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                              to={`/admin/jobs?id=${job.id}`}
                              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="space-y-8"
        >
          {/* Unverified Employers */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <motion.div
                    animate={{ rotate: [0, 20, -20, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 2 }}
                  >
                    <ShieldExclamationIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  </motion.div>
                  Unverified Employers 
                  <motion.span 
                    key={stats.employers.unverified}
                    initial={{ scale: 1.5, color: '#f59e0b' }}
                    animate={{ scale: 1, color: '#6b7280' }}
                    className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium"
                  >
                    {stats.employers.unverified}
                  </motion.span>
                </h2>
                <Link
                  to="/admin/users?filter=unverified"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              <AnimatePresence>
                {unverifiedEmployers.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-6 text-center text-gray-500"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    >
                      <TrophyIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    </motion.div>
                    <p className="text-sm font-medium">All employers verified!</p>
                  </motion.div>
                ) : (
                  unverifiedEmployers.map((employer, index) => (
                    <motion.div 
                      key={employer.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {employer.employer_profiles?.[0]?.company_name || employer.full_name}
                          </h3>
                          <p className="text-xs text-gray-500 mb-1">
                            {employer.employer_profiles?.[0]?.industry || 'Industry not specified'} • {timeAgo(employer.created_at)}
                          </p>
                          {employer.employer_profiles?.[0]?.company_size && (
                            <p className="text-xs text-gray-400">
                              {employer.employer_profiles[0].company_size} employees
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-1 ml-3">
                          <motion.button
                            onClick={() => handleQuickEmployerAction(employer.id, 'verify')}
                            disabled={refreshing}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex items-center px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50"
                          >
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Verify
                          </motion.button>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Link
                              to={`/admin/users?id=${employer.id}`}
                              className="flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs rounded-lg hover:from-blue-700 hover:to-blue-800"
                            >
                              <EyeIcon className="h-3 w-3" />
                            </Link>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Enhanced Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FireIcon className="h-5 w-5 text-blue-600 mr-2" />
                </motion.div>
                Quick Actions
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <QuickActionCard
                to="/admin/jobs"
                icon={BriefcaseIcon}
                title="Manage Jobs"
                subtitle={`${stats.jobs.pending} pending approval`}
                color="blue"
                highlight={stats.jobs.pending > 0}
                badge={stats.jobs.pending}
              />
              <QuickActionCard
                to="/admin/users"
                icon={UsersIcon}
                title="Manage Users"
                subtitle={`${stats.users.total} total users`}
                color="green"
              />
              <QuickActionCard
                to="/admin/analytics"
                icon={ChartBarIcon}
                title="View Analytics"
                subtitle="Platform insights"
                color="purple"
              />
              <QuickActionCard
                to="/admin/reports"
                icon={ExclamationTriangleIcon}
                title="Handle Reports"
                subtitle="User reports & issues"
                color="orange"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Recent Activity */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-8"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <ArrowPathIcon className="h-5 w-5 text-gray-600 mr-2" />
              </motion.div>
              Recent Platform Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {recentActivity.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 text-center text-gray-500"
                >
                  <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-lg">No recent activity</p>
                </motion.div>
              ) : (
                recentActivity.map((activity, index) => (
                  <motion.div 
                    key={`${activity.type}-${activity.id}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-4 hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <motion.div 
                        className={`w-3 h-3 rounded-full mr-4 ${
                          activity.type === 'job_posted' 
                            ? activity.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                            : activity.status === 'verified' ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <span>{activity.subtitle}</span>
                          <span>•</span>
                          <span>{timeAgo(activity.created_at)}</span>
                          {activity.status && (
                            <>
                              <span>•</span>
                              <motion.span 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  activity.status === 'active' ? 'bg-green-100 text-green-800' :
                                  activity.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                                  activity.status === 'verified' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {activity.status === 'pending_approval' ? 'Pending' : 
                                 activity.status === 'unverified' ? 'Unverified' :
                                 activity.status}
                              </motion.span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StatCard({ title, value, subtitle, trend, icon: Icon, color, link, highlight, delay }) {
  const colorClasses = {
    blue: { bg: 'from-blue-500 to-blue-600', icon: 'bg-blue-100 text-blue-600', border: 'border-blue-200' },
    green: { bg: 'from-green-500 to-green-600', icon: 'bg-green-100 text-green-600', border: 'border-green-200' },
    purple: { bg: 'from-purple-500 to-purple-600', icon: 'bg-purple-100 text-purple-600', border: 'border-purple-200' },
    orange: { bg: 'from-orange-500 to-orange-600', icon: 'bg-orange-100 text-orange-600', border: 'border-orange-200' }
  }

  const CardContent = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`bg-white rounded-2xl shadow-lg border-2 p-6 transition-all duration-300 ${
        highlight ? 'border-red-300 bg-gradient-to-br from-red-50 to-pink-50' : colorClasses[color].border + ' hover:shadow-xl'
      }`}
    >
      <div className="flex items-center">
        <motion.div 
          className={`p-3 rounded-xl ${colorClasses[color].icon}`}
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <motion.p 
            key={value}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-gray-900"
          >
            {value.toLocaleString()}
          </motion.p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className={`text-sm ${highlight ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
          {subtitle}
        </p>
        {trend !== 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center text-sm font-medium ${
              trend > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <motion.div
              animate={{ y: trend > 0 ? [0, -2, 0] : [0, 2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {trend > 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              )}
            </motion.div>
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )

  return link ? (
    <Link to={link} className="block">
      <CardContent />
    </Link>
  ) : (
    <CardContent />
  )
}

function QuickActionCard({ to, icon: Icon, title, subtitle, color, highlight, badge }) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        to={to}
        className="w-full flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 group"
      >
        <motion.div
          whileHover={{ rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className={`h-5 w-5 ${colorClasses[color]} mr-4`} />
        </motion.div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">{title}</p>
          <p className="text-xs text-gray-500 group-hover:text-gray-600">{subtitle}</p>
        </div>
        {badge > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium ml-2"
          >
            {badge}
          </motion.span>
        )}
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="ml-2"
        >
          <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
        </motion.div>
      </Link>
    </motion.div>
  )
}

function AdminDashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded-xl w-32"></div>
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center">
                  <div className="h-20 bg-gray-200 rounded-xl w-full"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-40"></div>
              </div>
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-14 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard