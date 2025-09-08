// src/pages/Analytics.jsx
import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { 
  ChartBarIcon,
  UsersIcon,
  BriefcaseIcon,
  EyeIcon,
  HeartIcon,
  DocumentDuplicateIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { useAnalytics } from '../hooks/useAnalytics'
import { USER_ROLES } from '../lib/supabase'
import AnalyticsCard from '../components/analytics/AnalyticsCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Select from '../components/ui/Select'

export default function Analytics() {
  const { profile } = useAuth()
  const [timeRange, setTimeRange] = useState('30d')
  const { analytics, loading, fetchAnalytics } = useAnalytics(timeRange)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Analytics Dashboard - JobFinder</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">
            {profile?.role === USER_ROLES.ADMIN 
              ? 'Platform-wide insights and performance metrics'
              : profile?.role === USER_ROLES.EMPLOYER
              ? 'Track your job postings and candidate engagement'
              : 'Your job search performance and insights'
            }
          </p>
        </div>
        
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          options={[
            { value: '7d', label: 'Last 7 days' },
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 3 months' },
            { value: '1y', label: 'Last year' }
          ]}
        />
      </div>

      {/* Role-specific Analytics */}
      {profile?.role === USER_ROLES.ADMIN && (
        <AdminAnalytics analytics={analytics} timeRange={timeRange} />
      )}
      
      {profile?.role === USER_ROLES.EMPLOYER && (
        <EmployerAnalytics analytics={analytics} timeRange={timeRange} />
      )}
      
      {profile?.role === USER_ROLES.JOB_SEEKER && (
        <JobSeekerAnalytics analytics={analytics} timeRange={timeRange} />
      )}
      
      {profile?.role === USER_ROLES.INSTITUTION_PARTNER && (
        <InstitutionAnalytics analytics={analytics} timeRange={timeRange} />
      )}
    </div>
  )
}

// Admin Analytics Component
function AdminAnalytics({ analytics, timeRange }) {
  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Users"
          value={analytics.totalUsers}
          change={analytics.userGrowth}
          icon={UsersIcon}
          color="blue"
        />
        <AnalyticsCard
          title="Active Jobs"
          value={analytics.activeJobs}
          change={analytics.jobGrowth}
          icon={BriefcaseIcon}
          color="green"
        />
        <AnalyticsCard
          title="Total Applications"
          value={analytics.totalApplications}
          change={analytics.applicationGrowth}
          icon={DocumentDuplicateIcon}
          color="purple"
        />
        <AnalyticsCard
          title="Match Success Rate"
          value={`${analytics.matchSuccessRate}%`}
          change={analytics.matchRateChange}
          icon={TrendingUpIcon}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UserGrowthChart data={analytics.userGrowthData} timeRange={timeRange} />
        <ApplicationsChart data={analytics.applicationData} timeRange={timeRange} />
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <EngagementMetrics 
          title="User Engagement"
          metrics={analytics.userEngagement}
        />
        <EngagementMetrics 
          title="Job Performance"
          metrics={analytics.jobPerformance}
        />
        <EngagementMetrics 
          title="System Health"
          metrics={analytics.systemHealth}
        />
      </div>

      {/* Detailed Reports */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Content</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Most Applied Jobs</h4>
              <div className="space-y-3">
                {analytics.topJobs?.map((job, index) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500">{job.company_name}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">{job.applications_count} applications</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Most Active Employers</h4>
              <div className="space-y-3">
                {analytics.topEmployers?.map((employer, index) => (
                  <div key={employer.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{employer.company_name}</p>
                        <p className="text-xs text-gray-500">{employer.job_count} jobs posted</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">{employer.total_applications} applications</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Employer Analytics Component
function EmployerAnalytics({ analytics, timeRange }) {
  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Active Jobs"
          value={analytics.activeJobs}
          change={analytics.jobGrowth}
          icon={BriefcaseIcon}
          color="blue"
        />
        <AnalyticsCard
          title="Total Applications"
          value={analytics.totalApplications}
          change={analytics.applicationGrowth}
          icon={DocumentDuplicateIcon}
          color="green"
        />
        <AnalyticsCard
          title="Profile Views"
          value={analytics.profileViews}
          change={analytics.viewsGrowth}
          icon={EyeIcon}
          color="purple"
        />
        <AnalyticsCard
          title="Hire Rate"
          value={`${analytics.hireRate}%`}
          change={analytics.hireRateChange}
          icon={TrendingUpIcon}
          color="orange"
        />
      </div>

      {/* Job Performance Chart */}
      <JobPerformanceChart data={analytics.jobPerformanceData} timeRange={timeRange} />

      {/* Application Funnel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Application Funnel</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {analytics.applicationFunnel?.map((stage, index) => (
              <div key={stage.name} className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{stage.name}</span>
                    <span className="text-sm text-gray-600">{stage.count} ({stage.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Jobs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Top Performing Jobs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.topJobs?.map((job) => (
                <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500">Posted {job.created_at}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.views_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.applications_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.conversion_rate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      job.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Job Seeker Analytics Component
function JobSeekerAnalytics({ analytics, timeRange }) {
  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Applications Sent"
          value={analytics.applicationsSent}
          change={analytics.applicationGrowth}
          icon={DocumentDuplicateIcon}
          color="blue"
        />
        <AnalyticsCard
          title="Profile Views"
          value={analytics.profileViews}
          change={analytics.viewsGrowth}
          icon={EyeIcon}
          color="green"
        />
        <AnalyticsCard
          title="Jobs Saved"
          value={analytics.jobsSaved}
          change={analytics.savedGrowth}
          icon={HeartIcon}
          color="purple"
        />
        <AnalyticsCard
          title="Response Rate"
          value={`${analytics.responseRate}%`}
          change={analytics.responseRateChange}
          icon={TrendingUpIcon}
          color="orange"
        />
      </div>

      {/* Application Status Chart */}
      <ApplicationsChart data={analytics.applicationStatusData} timeRange={timeRange} />

      {/* Search Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Job Search Activity</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Most Searched Keywords</h4>
              <div className="space-y-2">
                {analytics.topSearches?.map((search, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">{search.keyword}</span>
                    <span className="text-sm text-gray-500">{search.count} searches</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Application Timeline</h4>
              <div className="space-y-3">
                {analytics.recentApplications?.map((app) => (
                  <div key={app.id} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      app.status === 'shortlisted' ? 'bg-green-500' :
                      app.status === 'rejected' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{app.job_title}</p>
                      <p className="text-xs text-gray-500">{app.company_name} • {app.applied_date}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      app.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Institution Analytics Component
function InstitutionAnalytics({ analytics, timeRange }) {
  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Students Tracked"
          value={analytics.totalStudents}
          change={analytics.studentGrowth}
          icon={UsersIcon}
          color="blue"
        />
        <AnalyticsCard
          title="Successful Placements"
          value={analytics.placements}
          change={analytics.placementGrowth}
          icon={BriefcaseIcon}
          color="green"
        />
        <AnalyticsCard
          title="Placement Rate"
          value={`${analytics.placementRate}%`}
          change={analytics.placementRateChange}
          icon={TrendingUpIcon}
          color="purple"
        />
        <AnalyticsCard
          title="Partner Companies"
          value={analytics.partnerCompanies}
          change={analytics.partnerGrowth}
          icon={BuildingOfficeIcon}
          color="orange"
        />
      </div>

      {/* Placement Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Placement Trends</h3>
        </div>
        <div className="p-6">
          {/* Chart would go here */}
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Placement trends chart</p>
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Department Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placement Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Salary
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.departmentStats?.map((dept) => (
                <tr key={dept.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dept.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dept.total_students}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dept.placed_students}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dept.placement_rate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${dept.avg_salary?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

