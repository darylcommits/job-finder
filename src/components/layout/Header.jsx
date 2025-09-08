// src/components/layout/Header.jsx
import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Bars3Icon, 
  XMarkIcon, 
  BellIcon,
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import logo from '../../assets/logo.jpg';
import { useAuth } from '../../contexts/AuthContext'
import { USER_ROLES } from '../../lib/supabase'
import { getInitials, getAvatarColor } from '../../lib/utils'

// Navigation items based on user role
const getNavigationItems = (role) => {
  const baseItems = [
    { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  ]

  switch (role) {
    case USER_ROLES.JOB_SEEKER:
      return [
        ...baseItems,
        { name: 'Find Jobs', href: '/jobs', icon: BriefcaseIcon },
        { name: 'Applications', href: '/applications', icon: DocumentDuplicateIcon },
        { name: 'Messages', href: '/messages', icon: ChatBubbleLeftIcon },
      ]
    
    case USER_ROLES.EMPLOYER:
      return [
        ...baseItems,
        { name: 'Post Job', href: '/post-job', icon: PlusIcon },
        { name: 'Candidates', href: '/candidates', icon: UsersIcon },
        { name: 'Messages', href: '/messages', icon: ChatBubbleLeftIcon },
      ]
    
    case USER_ROLES.ADMIN:
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: ChartBarIcon },
        { name: 'Users', href: '/admin/users', icon: UsersIcon },
        { name: 'Jobs', href: '/admin/jobs', icon: BriefcaseIcon },
        { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
      ]
    
    case USER_ROLES.INSTITUTION_PARTNER:
      return [
        ...baseItems,
        { name: 'Students', href: '/students', icon: UsersIcon },
        { name: 'Placements', href: '/placements', icon: BuildingOfficeIcon },
        { name: 'Programs', href: '/programs', icon: AcademicCapIcon },
      ]
    
    default:
      return baseItems
  }
}

export default function Header() {
  const { user, profile, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  
  const location = useLocation()
  const navigate = useNavigate()
  const profileMenuRef = useRef(null)
  const notificationsRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navigationItems = profile ? getNavigationItems(profile.role) : []

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const getRoleDisplay = (role) => {
    switch (role) {
      case USER_ROLES.JOB_SEEKER:
        return 'Job Seeker'
      case USER_ROLES.EMPLOYER:
        return 'Employer'
      case USER_ROLES.ADMIN:
        return 'Administrator'
      case USER_ROLES.INSTITUTION_PARTNER:
        return 'Institution Partner'
      default:
        return 'User'
    }
  }

  // Determine the appropriate logo link based on user role
  const getLogoLink = () => {
    if (profile?.role === USER_ROLES.ADMIN) {
      return '/admin/dashboard'
    }
    return '/dashboard'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to={getLogoLink()} className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
  <img 
    src={logo} 
    alt="Logo" 
    className="h-5 w-5"
  />
</div>
              <span className="ml-2 text-xl font-bold text-gray-900">JobFinder</span>
              {profile?.role === USER_ROLES.ADMIN && (
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  Admin
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Right side - Notifications, Profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <BellIcon className="h-6 w-6" />
                {/* Notification badge */}
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Notifications dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {/* Placeholder notifications */}
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No new notifications
                      </div>
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200">
                      <Link
                        to="/notifications"
                        className="text-sm text-blue-600 hover:text-blue-500"
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {profile?.avatar_url ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Profile'}
                  />
                ) : (
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(profile?.full_name || user?.email || 'U')}`}>
                    {getInitials(profile?.full_name || user?.email || 'User')}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleDisplay(profile?.role)}
                  </p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              </button>

              {/* Profile dropdown menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <UserCircleIcon className="h-4 w-4 mr-2" />
                      View Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false)
                        handleSignOut()
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}