
// src/components/admin/QuickActions.jsx
import { 
  UserPlusIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import Button from '../ui/Button'
import Card from '../ui/Card'

export default function QuickActions({ onRefresh }) {
  const actions = [
    {
      label: 'Create Admin User',
      icon: UserPlusIcon,
      action: () => window.open('/admin/users/create', '_blank'),
      color: 'blue'
    },
    {
      label: 'System Settings',
      icon: Cog6ToothIcon,
      action: () => window.open('/admin/settings', '_blank'),
      color: 'gray'
    },
    {
      label: 'Generate Report',
      icon: ChartBarIcon,
      action: () => window.open('/admin/reports/generate', '_blank'),
      color: 'green'
    },
    {
      label: 'Bulk Verification',
      icon: ShieldCheckIcon,
      action: () => window.open('/admin/verifications/bulk', '_blank'),
      color: 'orange'
    }
  ]

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
          >
            <ArrowPathIcon className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={action.action}
              className="w-full justify-start"
            >
              <action.icon className="h-4 w-4 mr-3" />
              {action.label}
            </Button>
          ))}
        </div>

        {/* System Status */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">System Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <span className="text-xs text-green-600">Healthy</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Services</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <span className="text-xs text-green-600">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Storage</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                <span className="text-xs text-yellow-600">85% Used</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}