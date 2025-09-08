// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  BriefcaseIcon, 
  UsersIcon, 
  ChartBarIcon, 
  PlusIcon,
  EyeIcon,
  HeartIcon,
  DocumentDuplicateIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon, 
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'

import { useAuth } from '../contexts/AuthContext'
import { USER_ROLES, supabase, TABLES } from '../lib/supabase'
import { formatDate } from '../lib/utils'

export default function Dashboard() {
  const { profile } = useAuth()
  
  // Render different dashboard based on user role
  switch (profile?.role) {
    case USER_ROLES.JOB_SEEKER:
      return <JobSeekerDashboard />
    case USER_ROLES.EMPLOYER:
      return <EmployerDashboard />
    case USER_ROLES.ADMIN:
      return <AdminDashboard />
    case USER_ROLES.INSTITUTION_PARTNER:
      return <InstitutionDashboard />
    default:
      return <DefaultDashboard />
  }
}

// Job Seeker Dashboard
function JobSeekerDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    applications: 0,
    interviews: 0,
    savedJobs: 0,
    profileViews: 0
  })
  const [recentApplications, setRecentApplications] = useState([])
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [profile?.id])

  const fetchDashboardData = async () => {
    if (!profile?.id) return

    try {
      // Fetch applications count and recent applications
      const { data: applications, error: appsError } = await supabase
        .from(TABLES.APPLICATIONS)
        .select(`
          *,
          jobs (
            title,
            employer_profiles!inner (
              company_name
            )
          )
        `)
        .eq('applicant_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (appsError) throw appsError

      // Fetch saved jobs count
      const { count: savedCount, error: savedError } = await supabase
        .from(TABLES.SAVED_ITEMS)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('item_type', 'job')

      if (savedError) throw savedError

      // Fetch profile views
      const { count: viewsCount, error: viewsError } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id)

      if (viewsError) throw viewsError

      // Fetch recommended jobs based on skills and preferences
      const { data: jobs, error: jobsError } = await supabase
        .from(TABLES.JOBS)
        .select(`
          *,
          employer_profiles!inner (
            company_name,
            company_logo_url
          )
        `)
        .eq('status', 'active')
        .limit(6)

      if (jobsError) throw jobsError

      // Count different application statuses
      const totalApplications = applications?.length || 0
      const interviews = applications?.filter(app => app.status === 'interview')?.length || 0

      setStats({
        applications: totalApplications,
        interviews,
        savedJobs: savedCount || 0,
        profileViews: viewsCount || 0
      })

      setRecentApplications(applications || [])
      setRecommendedJobs(jobs || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Dashboard - JobFinder</title>
      </Helmet>

      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.full_name || 'Job Seeker'}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your job search today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Applications"
          value={stats.applications}
          icon={DocumentDuplicateIcon}
          color="blue"
        />
        <StatCard
          title="Interviews"
          value={stats.interviews}
          icon={UsersIcon}
          color="green"
        />
        <StatCard
          title="Saved Jobs"
          value={stats.savedJobs}
          icon={HeartIcon}
          color="red"
        />
        <StatCard
          title="Profile Views"
          value={stats.profileViews}
          icon={EyeIcon}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
              <Link
                to="/applications"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {application.jobs?.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {application.jobs?.employer_profiles?.company_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Applied {formatDate(application.created_at)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No applications yet. Start applying to jobs!
              </p>
            )}
          </div>
        </div>

        {/* Recommended Jobs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recommended Jobs</h2>
              <Link
                to="/jobs"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recommendedJobs.length > 0 ? (
              <div className="space-y-4">
                {recommendedJobs.slice(0, 4).map((job) => (
                  <div key={job.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {job.employer_profiles?.company_logo_url ? (
                        <img
                          src={job.employer_profiles.company_logo_url}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {job.employer_profiles?.company_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {job.location} • {job.employment_type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No job recommendations available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/jobs"
            className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <BriefcaseIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Browse Jobs</h3>
              <p className="text-sm text-gray-500">Find your next opportunity</p>
            </div>
          </Link>
          <Link
            to="/profile"
            className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <UsersIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Update Profile</h3>
              <p className="text-sm text-gray-500">Keep your profile current</p>
            </div>
          </Link>
          <Link
            to="/messages"
            className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <ChatBubbleLeftIcon className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Messages</h3>
              <p className="text-sm text-gray-500">Connect with employers</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Employer Dashboard
function EmployerDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    shortlistedCandidates: 0,
    hiredCandidates: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployerData()
  }, [profile?.id])

  const fetchEmployerData = async () => {
    if (!profile?.id) return

    try {
      // Fetch job counts
      const { count: activeJobsCount } = await supabase
        .from(TABLES.JOBS)
        .select('*', { count: 'exact', head: true })
        .eq('employer_id', profile.id)
        .eq('status', 'active')

      // Fetch application counts for employer's jobs
      const { data: applications } = await supabase
        .from(TABLES.APPLICATIONS)
        .select('*, jobs!inner(*)')
        .eq('jobs.employer_id', profile.id)

      const totalApplications = applications?.length || 0
      const shortlistedCandidates = applications?.filter(app => app.status === 'shortlisted')?.length || 0
      const hiredCandidates = applications?.filter(app => app.status === 'offered')?.length || 0

      setStats({
        activeJobs: activeJobsCount || 0,
        totalApplications,
        shortlistedCandidates,
        hiredCandidates
      })
    } catch (error) {
      console.error('Error fetching employer data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <DashboardSkeleton />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Employer Dashboard - JobFinder</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.employer_profiles?.[0]?.company_name || 'Employer'}!
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your job postings and find great candidates.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Jobs"
          value={stats.activeJobs}
          icon={BriefcaseIcon}
          color="blue"
        />
        <StatCard
          title="Total Applications"
          value={stats.totalApplications}
          icon={DocumentDuplicateIcon}
          color="green"
        />
        <StatCard
          title="Shortlisted"
          value={stats.shortlistedCandidates}
          icon={UsersIcon}
          color="yellow"
        />
        <StatCard
          title="Hired"
          value={stats.hiredCandidates}
          icon={CheckCircleIcon}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/post-job"
          className="flex items-center p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <PlusIcon className="h-8 w-8 text-blue-600 mr-4" />
          <div>
            <h3 className="font-medium text-gray-900">Post New Job</h3>
            <p className="text-sm text-gray-500">Attract top talent</p>
          </div>
        </Link>
        <Link
          to="/candidates"
          className="flex items-center p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <UsersIcon className="h-8 w-8 text-green-600 mr-4" />
          <div>
            <h3 className="font-medium text-gray-900">Browse Candidates</h3>
            <p className="text-sm text-gray-500">Find perfect matches</p>
          </div>
        </Link>
        <Link
          to="/analytics"
          className="flex items-center p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <ChartBarIcon className="h-8 w-8 text-purple-600 mr-4" />
          <div>
            <h3 className="font-medium text-gray-900">View Analytics</h3>
            <p className="text-sm text-gray-500">Track performance</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

// Admin Dashboard
function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Admin Dashboard - JobFinder</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor platform activity and manage users.</p>
      </div>

      {/* Admin-specific content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/users"
          className="flex items-center p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <UsersIcon className="h-8 w-8 text-blue-600 mr-4" />
          <div>
            <h3 className="font-medium text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-500">User verification & management</p>
          </div>
        </Link>
        <Link
          to="/admin/jobs"
          className="flex items-center p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <BriefcaseIcon className="h-8 w-8 text-green-600 mr-4" />
          <div>
            <h3 className="font-medium text-gray-900">Job Moderation</h3>
            <p className="text-sm text-gray-500">Review job postings</p>
          </div>
        </Link>
        <Link
          to="/admin/reports"
          className="flex items-center p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-4" />
          <div>
            <h3 className="font-medium text-gray-900">Reports</h3>
            <p className="text-sm text-gray-500">Handle user reports</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

// Institution Dashboard
function InstitutionDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Institution Dashboard - JobFinder</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Institution Dashboard</h1>
        <p className="mt-2 text-gray-600">Track student placements and partnerships.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/students"
          className="flex items-center p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-4" />
          <div>
            <h3 className="font-medium text-gray-900">Students</h3>
            <p className="text-sm text-gray-500">Track student progress</p>
          </div>
        </Link>
        <Link
          to="/placements"
          className="flex items-center p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <BuildingOfficeIcon className="h-8 w-8 text-green-600 mr-4" />
          <div>
            <h3 className="font-medium text-gray-900">Placements</h3>
            <p className="text-sm text-gray-500">Monitor job placements</p>
          </div>
        </Link>
        <Link
          to="/programs"
          className="flex items-center p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <ChartBarIcon className="h-8 w-8 text-purple-600 mr-4" />
          <div>
            <h3 className="font-medium text-gray-900">Programs</h3>
            <p className="text-sm text-gray-500">Manage training programs</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

// Default Dashboard
function DefaultDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to JobFinder</h1>
        <p className="text-gray-600">Complete your profile setup to get started.</p>
      </div>
    </div>
  )
}

// Reusable Components
function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
    yellow: 'text-yellow-600 bg-yellow-50'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper function for status colors
function getStatusColor(status) {
  const colors = {
    applied: 'bg-blue-100 text-blue-800',
    viewed: 'bg-yellow-100 text-yellow-800',
    shortlisted: 'bg-green-100 text-green-800',
    interview: 'bg-purple-100 text-purple-800',
    offered: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}