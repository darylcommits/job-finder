// src/pages/admin/AdminAnalytics.jsx - Fixed version without recharts dependency
import { useState, useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import {
  ChartBarIcon,
  UsersIcon,
  BriefcaseIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  MapPinIcon,
  TagIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

import { useAuth } from '../../contexts/AuthContext'
import { supabase, TABLES, USER_ROLES } from '../../lib/supabase'
import { formatDate, timeAgo } from '../../lib/utils'
import { JOB_CATEGORIES } from '../../lib/constants'

const TIME_RANGES = {
  '7d': { label: '7 Days', days: 7 },
  '30d': { label: '30 Days', days: 30 },
  '90d': { label: '3 Months', days: 90 },
  '1y': { label: '1 Year', days: 365 }
}

export default function AdminAnalytics() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [analytics, setAnalytics] = useState({
    overview: {
      total_users: 0,
      total_jobs: 0,
      total_applications: 0,
      total_views: 0,
      growth_rates: {
        users: 0,
        jobs: 0,
        applications: 0,
        views: 0
      }
    },
    user_growth: [],
    job_activity: [],
    application_trends: [],
    geographic_distribution: [],
    category_distribution: [],
    user_role_distribution: [],
    top_employers: [],
    performance_metrics: {
      avg_applications_per_job: 0,
      avg_views_per_job: 0,
      conversion_rate: 0,
      active_user_rate: 0
    }
  })

  useEffect(() => {
    if (profile?.role === USER_ROLES.ADMIN) {
      fetchAnalytics()
    }
  }, [profile, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching analytics data...')

      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - TIME_RANGES[timeRange].days * 24 * 60 * 60 * 1000)

      // Fetch all required data
      const [
        usersData,
        jobsData,
        swipesData,
        profilesData
      ] = await Promise.all([
        fetchUsersData(startDate, endDate),
        fetchJobsData(startDate, endDate),
        fetchSwipesData(startDate, endDate),
        fetchProfilesData()
      ])

      // Process and combine all analytics
      const processedAnalytics = processAnalyticsData({
        users: usersData,
        jobs: jobsData,
        swipes: swipesData,
        profiles: profilesData
      }, startDate, endDate)

      setAnalytics(processedAnalytics)
      console.log('✅ Analytics data processed successfully')

    } catch (error) {
      console.error('❌ Error fetching analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsersData = async (startDate, endDate) => {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('id, role, created_at, is_active, location, last_active')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
    
    if (error) throw error
    return data || []
  }

  const fetchJobsData = async (startDate, endDate) => {
    const { data, error } = await supabase
      .from(TABLES.JOBS)
      .select('id, category, status, created_at, views_count, applications_count, location, employer_id')
    
    if (error) throw error
    return data || []
  }

  const fetchSwipesData = async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.SWIPES || 'swipes')
        .select('id, action, created_at, target_type')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.warn('Swipes table not available:', error)
      return []
    }
  }

  const fetchProfilesData = async () => {
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select(`
        id, role, location, is_active, created_at,
        employer_profiles!employer_profiles_user_id_fkey (
          company_name
        )
      `)
    
    if (error) throw error
    return data || []
  }

  const processAnalyticsData = (data, startDate, endDate) => {
    const { users, jobs, swipes, profiles } = data
    
    // Calculate overview metrics
    const totalUsers = profiles.length
    const totalJobs = jobs.length
    const totalApplications = swipes.filter(s => s.action === 'like').length
    const totalViews = jobs.reduce((sum, job) => sum + (job.views_count || 0), 0)

    // Calculate growth rates (compared to previous period)
    const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()))
    const previousUsers = profiles.filter(p => 
      new Date(p.created_at) >= previousPeriodStart && new Date(p.created_at) < startDate
    ).length
    const previousJobs = jobs.filter(j => 
      new Date(j.created_at) >= previousPeriodStart && new Date(j.created_at) < startDate
    ).length

    const userGrowthRate = previousUsers === 0 ? 100 : ((users.length - previousUsers) / previousUsers) * 100
    const jobGrowthRate = previousJobs === 0 ? 100 : ((jobs.filter(j => 
      new Date(j.created_at) >= startDate
    ).length - previousJobs) / previousJobs) * 100

    // Generate time series data
    const userGrowth = generateTimeSeries(users, startDate, endDate, 'created_at')
    const jobActivity = generateTimeSeries(
      jobs.filter(j => new Date(j.created_at) >= startDate), 
      startDate, 
      endDate, 
      'created_at'
    )
    const applicationTrends = generateTimeSeries(swipes, startDate, endDate, 'created_at')

    // Geographic distribution
    const locationCounts = profiles.reduce((acc, profile) => {
      const location = profile.location || 'Unknown'
      acc[location] = (acc[location] || 0) + 1
      return acc
    }, {})

    const geographicDistribution = Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Category distribution
    const categoryCounts = jobs.reduce((acc, job) => {
      const category = job.category || 'Uncategorized'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})

    const categoryDistribution = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)

    // User role distribution
    const roleCounts = profiles.reduce((acc, profile) => {
      const role = profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {})

    const userRoleDistribution = Object.entries(roleCounts)
      .map(([role, count]) => ({ role, count }))

    // Top employers (by job count)
    const employerJobCounts = jobs.reduce((acc, job) => {
      if (job.employer_id) {
        acc[job.employer_id] = (acc[job.employer_id] || 0) + 1
      }
      return acc
    }, {})

    const topEmployers = Object.entries(employerJobCounts)
      .map(([employerId, jobCount]) => {
        const employer = profiles.find(p => p.id === employerId)
        return {
          id: employerId,
          name: employer?.employer_profiles?.[0]?.company_name || employer?.full_name || 'Unknown',
          job_count: jobCount,
          total_applications: jobs
            .filter(j => j.employer_id === employerId)
            .reduce((sum, j) => sum + (j.applications_count || 0), 0)
        }
      })
      .sort((a, b) => b.job_count - a.job_count)
      .slice(0, 10)

    // Performance metrics
    const avgApplicationsPerJob = totalJobs > 0 ? totalApplications / totalJobs : 0
    const avgViewsPerJob = totalJobs > 0 ? totalViews / totalJobs : 0
    const conversionRate = totalViews > 0 ? (totalApplications / totalViews) * 100 : 0
    const activeUserRate = totalUsers > 0 ? (profiles.filter(p => p.is_active).length / totalUsers) * 100 : 0

    return {
      overview: {
        total_users: totalUsers,
        total_jobs: totalJobs,
        total_applications: totalApplications,
        total_views: totalViews,
        growth_rates: {
          users: userGrowthRate,
          jobs: jobGrowthRate,
          applications: 0, // Calculate if needed
          views: 0 // Calculate if needed
        }
      },
      user_growth: userGrowth,
      job_activity: jobActivity,
      application_trends: applicationTrends,
      geographic_distribution: geographicDistribution,
      category_distribution: categoryDistribution,
      user_role_distribution: userRoleDistribution,
      top_employers: topEmployers,
      performance_metrics: {
        avg_applications_per_job: avgApplicationsPerJob,
        avg_views_per_job: avgViewsPerJob,
        conversion_rate: conversionRate,
        active_user_rate: activeUserRate
      }
    }
  }

  const generateTimeSeries = (data, startDate, endDate, dateField) => {
    const days = TIME_RANGES[timeRange].days
    const series = []
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const count = data.filter(item => 
        new Date(item[dateField]).toISOString().split('T')[0] === dateStr
      ).length
      
      series.push({
        date: dateStr,
        count,
        formatted_date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }
    
    return series
  }

  if (loading) {
    return <AnalyticsSkeleton />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Analytics - Admin Dashboard</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Insights and metrics for your job platform
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(TIME_RANGES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <OverviewCard
          title="Total Users"
          value={analytics.overview.total_users}
          growth={analytics.overview.growth_rates.users}
          icon={UsersIcon}
          color="blue"
        />
        <OverviewCard
          title="Total Jobs"
          value={analytics.overview.total_jobs}
          growth={analytics.overview.growth_rates.jobs}
          icon={BriefcaseIcon}
          color="green"
        />
        <OverviewCard
          title="Applications"
          value={analytics.overview.total_applications}
          growth={analytics.overview.growth_rates.applications}
          icon={ChartBarIcon}
          color="purple"
        />
        <OverviewCard
          title="Job Views"
          value={analytics.overview.total_views}
          growth={analytics.overview.growth_rates.views}
          icon={EyeIcon}
          color="orange"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Avg Applications/Job"
          value={analytics.performance_metrics.avg_applications_per_job.toFixed(1)}
          icon={ChartBarIcon}
        />
        <MetricCard
          title="Avg Views/Job"
          value={analytics.performance_metrics.avg_views_per_job.toFixed(1)}
          icon={EyeIcon}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${analytics.performance_metrics.conversion_rate.toFixed(1)}%`}
          icon={ArrowTrendingUpIcon}
        />
        <MetricCard
          title="Active User Rate"
          value={`${analytics.performance_metrics.active_user_rate.toFixed(1)}%`}
          icon={UsersIcon}
        />
      </div>

      {/* Simple Charts Replacement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* User Growth Chart */}
        <ChartCard title="User Registration Trends">
          <SimpleLineChart data={analytics.user_growth} color="blue" />
        </ChartCard>

        {/* Job Activity Chart */}
        <ChartCard title="Job Posting Activity">
          <SimpleLineChart data={analytics.job_activity} color="green" />
        </ChartCard>

        {/* User Role Distribution */}
        <ChartCard title="User Role Distribution">
          <SimpleBarChart data={analytics.user_role_distribution} />
        </ChartCard>

        {/* Category Distribution */}
        <ChartCard title="Job Categories">
          <SimpleBarChart data={analytics.category_distribution.slice(0, 8)} />
        </ChartCard>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPinIcon className="h-5 w-5 text-blue-600 mr-2" />
              Top Locations
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.geographic_distribution.slice(0, 10).map((location, index) => (
                <div key={location.location} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </div>
                    <span className="text-gray-900">{location.location}</span>
                  </div>
                  <span className="text-gray-600 font-medium">{location.count} users</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Employers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BriefcaseIcon className="h-5 w-5 text-green-600 mr-2" />
              Top Employers
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.top_employers.slice(0, 10).map((employer, index) => (
                <div key={employer.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-gray-900 font-medium">{employer.name}</div>
                      <div className="text-sm text-gray-500">{employer.total_applications} applications</div>
                    </div>
                  </div>
                  <span className="text-gray-600 font-medium">{employer.job_count} jobs</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple chart components to replace recharts
function SimpleLineChart({ data, color = "blue" }) {
  const maxValue = Math.max(...data.map(d => d.count))
  const colorClass = color === "blue" ? "stroke-blue-500" : "stroke-green-500"
  
  return (
    <div className="h-64 flex items-end space-x-1">
      {data.map((item, index) => (
        <div
          key={index}
          className="flex-1 bg-gray-100 rounded-t relative group"
          style={{ height: `${(item.count / maxValue) * 200}px` }}
        >
          <div className={`w-full h-full ${color === "blue" ? "bg-blue-500" : "bg-green-500"} rounded-t opacity-70`}></div>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {item.count}
          </div>
        </div>
      ))}
    </div>
  )
}

function SimpleBarChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.count))
  
  return (
    <div className="space-y-3">
      {data.slice(0, 6).map((item, index) => (
        <div key={index} className="flex items-center">
          <div className="w-24 text-sm text-gray-600 truncate">{item.role || item.category}</div>
          <div className="flex-1 mx-3 bg-gray-200 rounded-full h-3 relative">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${(item.count / maxValue) * 100}%` }}
            ></div>
          </div>
          <div className="w-12 text-sm text-gray-900 text-right">{item.count}</div>
        </div>
      ))}
    </div>
  )
}

function OverviewCard({ title, value, growth, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
      </div>
      {growth !== 0 && (
        <div className="mt-4 flex items-center">
          <div className={`flex items-center text-sm ${
            growth > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {growth > 0 ? (
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
            )}
            <span>{Math.abs(growth).toFixed(1)}%</span>
          </div>
          <span className="text-gray-500 text-sm ml-2">vs previous period</span>
        </div>
      )}
    </div>
  )
}

function MetricCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <Icon className="h-6 w-6 text-gray-400 mr-3" />
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
          <div className="flex space-x-4">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>

        {/* Stats skeleton */}
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
              <div className="mt-4">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance metrics skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="h-6 w-6 bg-gray-200 rounded mr-3"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
              </div>
              <div className="p-6">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Tables skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(j => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-gray-200 rounded-full mr-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}