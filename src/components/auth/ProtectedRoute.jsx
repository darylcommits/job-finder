// src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/', 
  allowedRoles = null 
}) {
  const { user, profile, loading, initializing } = useAuth()
  const location = useLocation()

  // Show loading spinner while initializing or loading
  if (initializing || loading) {
    return <LoadingSpinner />
  }

  // If route requires authentication
  if (requireAuth) {
    // Not authenticated - redirect to login
    if (!user) {
      return (
        <Navigate 
          to="/login" 
          state={{ from: location }} 
          replace 
        />
      )
    }

    // Check if profile exists (required for authenticated users)
    if (!profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg 
                  className="h-6 w-6 text-red-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Profile Not Found</h3>
              <p className="mt-2 text-sm text-gray-500">
                There was an issue loading your profile. Please try refreshing the page or contact support.
              </p>
              <div className="mt-6 flex justify-center space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => window.location.href = 'mailto:support@jobfinder.com'}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Check role-based access
    if (allowedRoles && !allowedRoles.includes(profile.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <svg 
                  className="h-6 w-6 text-yellow-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
              <p className="mt-2 text-sm text-gray-500">
                You don't have permission to access this page. 
                {allowedRoles.length === 1 
                  ? ` This page is only available for ${allowedRoles[0]} accounts.`
                  : ` This page requires one of the following roles: ${allowedRoles.join(', ')}.`
                }
              </p>
              <div className="mt-6">
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // User is authenticated and authorized
    return children
  }

  // Route doesn't require authentication
  else {
    // If user is authenticated and we have a redirect path, redirect them
    if (user && redirectTo) {
      return <Navigate to={redirectTo} replace />
    }
    
    // Allow access to public route
    return children
  }
}