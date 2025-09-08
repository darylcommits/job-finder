// src/pages/admin/AdminDashboard.jsx - Enhanced version with real functionality
import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
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
  PlayIcon
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Admin Dashboard - JobFinder</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage your job platform
          </p>
        </div>
        <button
          onClick={refreshDashboard}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {refreshing ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          ) : (
            <ArrowRightIcon className="h-5 w-5 mr-2" />
          )}
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.users.total}
          subtitle={`${stats.users.active} active`}
          trend={stats.users.trend}
          icon={UsersIcon}
          color="blue"
          link="/admin/users"
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
        />
        <StatCard
          title="Applications"
          value={stats.applications.total}
          subtitle={`${stats.applications.this_week} this week`}
          trend={stats.applications.trend}
          icon={ChartBarIcon}
          color="purple"
          link="/admin/analytics"
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
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Jobs */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ClockIcon className="h-5 w-5 text-orange-500 mr-2" />
                  Pending Job Approvals ({stats.jobs.pending})
                </h2>
                <Link
                  to="/admin/jobs?filter=pending_approval"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingJobs.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p>No pending job approvals!</p>
                </div>
              ) : (
                pendingJobs.map((job, index) => (
                  <div key={job.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-sm font-medium text-gray-900">{job.title}</h3>
                          {(job.media_urls?.length > 0 || job.workplace_images?.length > 0) && (
                            <div className="flex items-center text-xs text-gray-500">
                              {job.media_urls?.length > 0 && (
                                <div className="flex items-center mr-2">
                                  <PhotoIcon className="h-3 w-3 mr-1" />
                                  {job.media_urls.length}
                                </div>
                              )}
                              {job.workplace_images?.length > 0 && (
                                <div className="flex items-center">
                                  <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                                  {job.workplace_images.length}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {job.employer_profiles?.company_name || 'Unknown Company'} • {timeAgo(job.created_at)}
                        </p>
                        
                        {/* Media preview */}
                        {job.media_urls?.length > 0 && (
                          <div className="flex space-x-2 mb-2">
                            {job.media_urls.slice(0, 3).map((url, mediaIndex) => {
                              const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url)
                              return (
                                <div key={mediaIndex} className="w-12 h-12 rounded border overflow-hidden">
                                  {isVideo ? (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                      <PlayIcon className="h-4 w-4 text-gray-500" />
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
                                </div>
                              )
                            })}
                            {job.media_urls.length > 3 && (
                              <div className="w-12 h-12 rounded border bg-gray-100 flex items-center justify-center">
                                <span className="text-xs text-gray-500">+{job.media_urls.length - 3}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleQuickJobAction(job.id, 'active')}
                          disabled={refreshing}
                          className="flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleQuickJobAction(job.id, 'rejected')}
                          disabled={refreshing}
                          className="flex items-center px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          <XMarkIcon className="h-3 w-3 mr-1" />
                          Reject
                        </button>
                        <Link
                          to={`/admin/jobs?id=${job.id}`}
                          className="flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Unverified Employers & Quick Actions */}
        <div className="space-y-8">
          {/* Unverified Employers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ShieldExclamationIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  Unverified Employers ({stats.employers.unverified})
                </h2>
                <Link
                  to="/admin/users?filter=unverified"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {unverifiedEmployers.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm">All employers verified!</p>
                </div>
              ) : (
                unverifiedEmployers.map((employer) => (
                  <div key={employer.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {employer.employer_profiles?.[0]?.company_name || employer.full_name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {employer.employer_profiles?.[0]?.industry || 'Industry not specified'} • {timeAgo(employer.created_at)}
                        </p>
                        {employer.employer_profiles?.[0]?.company_size && (
                          <p className="text-xs text-gray-400">
                            {employer.employer_profiles[0].company_size} employees
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-1 ml-4">
                        <button
                          onClick={() => handleQuickEmployerAction(employer.id, 'verify')}
                          disabled={refreshing}
                          className="flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Verify
                        </button>
                        <Link
                          to={`/admin/users?id=${employer.id}`}
                          className="flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          <EyeIcon className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-4">
              <Link
                to="/admin/jobs"
                className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BriefcaseIcon className="h-5 w-5 text-blue-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Manage Jobs</p>
                  <p className="text-xs text-gray-500">{stats.jobs.pending} pending approval</p>
                </div>
                {stats.jobs.pending > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {stats.jobs.pending}
                  </span>
                )}
              </Link>

              <Link
                to="/admin/users"
                className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UsersIcon className="h-5 w-5 text-green-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Manage Users</p>
                  <p className="text-xs text-gray-500">{stats.users.total} total users</p>
                </div>
              </Link>

              <Link
                to="/admin/analytics"
                className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChartBarIcon className="h-5 w-5 text-purple-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">View Analytics</p>
                  <p className="text-xs text-gray-500">Platform insights</p>
                </div>
              </Link>

              <Link
                to="/admin/reports"
                className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Handle Reports</p>
                  <p className="text-xs text-gray-500">User reports & issues</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Platform Activity</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p>No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={`${activity.type}-${activity.id}-${index}`} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      activity.type === 'job_posted' 
                        ? activity.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                        : activity.status === 'verified' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{activity.subtitle}</span>
                        <span>•</span>
                        <span>{timeAgo(activity.created_at)}</span>
                        {activity.status && (
                          <>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              activity.status === 'active' ? 'bg-green-100 text-green-800' :
                              activity.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                              activity.status === 'verified' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.status === 'pending_approval' ? 'Pending' : 
                               activity.status === 'unverified' ? 'Unverified' :
                               activity.status}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, trend, icon: Icon, color, link, highlight }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  }

  const CardContent = () => (
    <div className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all duration-200 ${
      highlight ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:shadow-md'
    }`}>
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className={`text-sm ${highlight ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
          {subtitle}
        </p>
        {trend !== 0 && (
          <div className={`flex items-center text-sm ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend > 0 ? (
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
            )}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  )

  return link ? (
    <Link to={link} className="block">
      <CardContent />
    </Link>
  ) : (
    <CardContent />
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
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
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
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center">
                  <div className="h-16 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-40"></div>
              </div>
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
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