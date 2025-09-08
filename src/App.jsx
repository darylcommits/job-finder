// src/App.jsx - Fixed routing configuration
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'

import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import Header from './components/layout/Header'
import { USER_ROLES } from './lib/supabase'

// Pages
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import Applications from './pages/Applications' // Job seeker's applications list
import JobApplication from './pages/JobApplication' // Single job application form
import PostJob from './pages/PostJob'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Messages from './pages/Messages'
import Analytics from './pages/Analytics'
import Login from './components/auth/LoginForm'
import Register from './components/auth/RegisterForm'

// Employer Pages
import Candidates from './pages/Candidates'

// Admin Pages
import { 
  AdminDashboard, 
  AdminUsers, 
  AdminJobs, 
  AdminReports, 
  AdminAnalytics 
} from './pages/admin'

// Global styles
import './styles/globals.css'

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  className: 'bg-white shadow-lg border',
                  style: {
                    maxWidth: '500px',
                  },
                }}
              />
              
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<LoginRoute />} />
                <Route path="/register" element={<RegisterRoute />} />
                
                {/* Protected routes for all authenticated users */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/jobs" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Jobs />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                {/* Job Application Form Route - For Job Seekers Only */}
                <Route path="/jobs/:jobId/apply" element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.JOB_SEEKER]}>
                    <AppLayout>
                      <JobApplication />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                {/* Job Seeker's Applications List - For Job Seekers Only */}
                <Route path="/applications" element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.JOB_SEEKER]}>
                    <AppLayout>
                      <Applications />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/post-job" element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.EMPLOYER]}>
                    <AppLayout>
                      <PostJob />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/candidates" element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.EMPLOYER]}>
                    <AppLayout>
                      <Candidates />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Profile />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/messages" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Messages />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Settings />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/analytics" element={
                  <ProtectedRoute allowedRoles={[USER_ROLES.EMPLOYER, USER_ROLES.INSTITUTION_PARTNER]}>
                    <AppLayout>
                      <Analytics />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={
                  <AdminRoute>
                    <AppLayout>
                      <AdminDashboard />
                    </AppLayout>
                  </AdminRoute>
                } />

                <Route path="/admin/users" element={
                  <AdminRoute>
                    <AppLayout>
                      <AdminUsers />
                    </AppLayout>
                  </AdminRoute>
                } />

                <Route path="/admin/jobs" element={
                  <AdminRoute>
                    <AppLayout>
                      <AdminJobs />
                    </AppLayout>
                  </AdminRoute>
                } />

                <Route path="/admin/reports" element={
                  <AdminRoute>
                    <AppLayout>
                      <AdminReports />
                    </AppLayout>
                  </AdminRoute>
                } />

                <Route path="/admin/analytics" element={
                  <AdminRoute>
                    <AppLayout>
                      <AdminAnalytics />
                    </AppLayout>
                  </AdminRoute>
                } />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  )
}

// Layout component for authenticated pages
function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}

// Login route component (redirects if already authenticated)
function LoginRoute() {
  return (
    <ProtectedRoute requireAuth={false} redirectTo="/dashboard">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Login />
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Register route component (redirects if already authenticated)
function RegisterRoute() {
  return (
    <ProtectedRoute requireAuth={false} redirectTo="/dashboard">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Register />
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default App