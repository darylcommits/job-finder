
// src/components/admin/RecentActivity.jsx
import { 
  UserIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { timeAgo } from '../../lib/utils'
import Card from '../ui/Card'

export default function RecentActivity({ activities }) {
  const getActivityIcon = (action) => {
    switch (action) {
      case 'user_registered':
        return UserIcon
      case 'job_posted':
        return BriefcaseIcon
      case 'report_submitted':
        return ExclamationTriangleIcon
      case 'user_verified':
        return ShieldCheckIcon
      default:
        return DocumentTextIcon
    }
  }

  const getActivityColor = (action) => {
    switch (action) {
      case 'user_registered':
        return 'text-green-600 bg-green-100'
      case 'job_posted':
        return 'text-blue-600 bg-blue-100'
      case 'report_submitted':
        return 'text-red-600 bg-red-100'
      case 'user_verified':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getActivityDescription = (activity) => {
    const userName = activity.profiles?.full_name || 'Anonymous User'
    
    switch (activity.action) {
      case 'user_registered':
        return `${userName} joined the platform as ${activity.profiles?.role}`
      case 'job_posted':
        return `${userName} posted a new job`
      case 'report_submitted':
        return `${userName} submitted a report`
      case 'user_verified':
        return `${userName} was verified`
      default:
        return `${userName} performed ${activity.action}`
    }
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
        
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.action)
            const colorClass = getActivityColor(activity.action)
            
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {timeAgo(activity.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        
        {activities.length === 0 && (
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </div>
    </Card>
  )
}