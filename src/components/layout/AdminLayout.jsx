// src/components/layout/AdminLayout.jsx
import { Link, useLocation } from 'react-router-dom'
import { 
  UsersIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  HomeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

const adminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Jobs', href: '/admin/jobs', icon: BriefcaseIcon },
  { name: 'Reports', href: '/admin/reports', icon: ExclamationTriangleIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
]

export default function AdminLayout({ children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 fixed left-0 top-16 bottom-0">
        <div className="flex flex-col h-full">
          {/* Admin Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">Admin Panel</h3>
                <p className="text-sm text-gray-500">System Management</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {adminNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-50 text-red-700 border-r-2 border-red-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Back to Main App */}
          <div className="p-4 border-t border-gray-200">
            <Link
              to="/dashboard"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
              Back to App
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Page Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {getPageTitle(location.pathname)}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {getPageDescription(location.pathname)}
            </p>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// Helper functions to get page title and description
function getPageTitle(pathname) {
  switch (pathname) {
    case '/admin':
    case '/admin/dashboard':
      return 'Admin Dashboard'
    case '/admin/users':
      return 'User Management'
    case '/admin/jobs':
      return 'Job Moderation'
    case '/admin/reports':
      return 'Reports Management'
    case '/admin/analytics':
      return 'Analytics'
    default:
      return 'Admin Panel'
  }
}

function getPageDescription(pathname) {
  switch (pathname) {
    case '/admin':
    case '/admin/dashboard':
      return 'Overview of system statistics and recent activity'
    case '/admin/users':
      return 'Manage user accounts, roles, and permissions'
    case '/admin/jobs':
      return 'Review and moderate job postings'
    case '/admin/reports':
      return 'Handle user reports and platform issues'
    case '/admin/analytics':
      return 'Platform analytics and insights'
    default:
      return 'System administration and management'
  }
}