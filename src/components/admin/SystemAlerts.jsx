
// src/components/admin/SystemAlerts.jsx
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { timeAgo } from '../../lib/utils'
import Card from '../ui/Card'

export default function SystemAlerts({ alerts }) {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return XCircleIcon
      case 'warning':
        return ExclamationTriangleIcon
      case 'success':
        return CheckCircleIcon
      case 'info':
      default:
        return InformationCircleIcon
    }
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'success':
        return 'text-green-600'
      case 'info':
      default:
        return 'text-blue-600'
    }
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">System Alerts</h3>
        
        <div className="space-y-4">
          {alerts?.map((alert) => {
            const Icon = getAlertIcon(alert.type)
            const colorClass = getAlertColor(alert.type)
            
            return (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Icon className={`h-5 w-5 mt-0.5 ${colorClass}`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {timeAgo(alert.timestamp)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        
        {(!alerts || alerts.length === 0) && (
          <div className="text-center py-8">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <p className="text-gray-500">All systems operational</p>
          </div>
        )}
      </div>
    </Card>
  )
}