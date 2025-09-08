// src/components/auth/AdminRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { USER_ROLES } from '../../lib/supabase'

/**
 * AdminRoute component that protects admin-only routes
 * This is a simpler alternative to using ProtectedRoute with allowedRoles
 * Use this when you specifically need admin-only access
 */
export default function AdminRoute({ children }) {
  const { user, profile, loading, initializing } = useAuth()

  // Show loading while checking authentication
  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Checking permissions...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect to dashboard if not admin
  if (!profile || profile.role !== USER_ROLES.ADMIN) {
    return <Navigate to="/dashboard" replace />
  }

  // Render children if user is admin
  return children
}