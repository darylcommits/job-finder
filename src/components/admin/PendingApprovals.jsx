
// src/components/admin/PendingApprovals.jsx
import { 
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { formatDate } from '../../lib/utils'
import Button from '../ui/Button'
import Card from '../ui/Card'

export default function PendingApprovals({ jobs, employers, onRefresh }) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Pending Jobs */}
          {jobs?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Job Postings ({jobs.length})</h4>
              <div className="space-y-3">
                {jobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-500">
                        {job.employer_profiles?.company_name} • {formatDate(job.created_at)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="ghost">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-green-600">
                        <CheckIcon className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600">
                        <XMarkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {jobs.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{jobs.length - 3} more pending jobs
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Pending Employers */}
          {employers?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Employer Verifications ({employers.length})</h4>
              <div className="space-y-3">
                {employers.slice(0, 3).map((employer) => (
                  <div key={employer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{employer.company_name}</p>
                      <p className="text-sm text-gray-500">
                        {employer.profiles?.email} • {formatDate(employer.created_at)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="ghost">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-green-600">
                        <CheckIcon className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600">
                        <XMarkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {employers.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{employers.length - 3} more pending verifications
                  </p>
                )}
              </div>
            </div>
          )}
          
          {(!jobs?.length && !employers?.length) && (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No pending approvals</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
