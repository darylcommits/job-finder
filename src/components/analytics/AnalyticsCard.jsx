
// src/components/analytics/AnalyticsCard.jsx
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

export default function AnalyticsCard({ title, value, change, icon: Icon, color }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50'
  }

  const isPositiveChange = change >= 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className={`ml-2 flex items-center text-sm ${
                isPositiveChange ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositiveChange ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                {Math.abs(change)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}