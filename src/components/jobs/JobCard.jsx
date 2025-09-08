/ src/components/jobs/JobCard.jsx
import { 
  MapPinIcon, 
  CurrencyDollarIcon, 
  CalendarDaysIcon,
  BuildingOfficeIcon,
  HeartIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { Link } from 'react-router-dom'
import { formatSalary, formatDate, timeAgo } from '../../lib/utils'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

export default function JobCard({ 
  job, 
  onSave, 
  onApply, 
  isSaved = false,
  showActions = true,
  showCompanyLogo = true,
  className = ''
}) {
  const handleSave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onSave?.(job.id)
  }

  const handleApply = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onApply?.(job.id)
  }

  return (
    <div className={`job-card ${job.is_featured ? 'job-card-featured' : ''} ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          {/* Company Logo */}
          {showCompanyLogo && (
            <div className="flex-shrink-0">
              {job.employer_profiles?.company_logo_url ? (
                <img
                  src={job.employer_profiles.company_logo_url}
                  alt={job.employer_profiles?.company_name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="h-6 w-6 text-gray-500" />
                </div>
              )}
            </div>
          )}

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                  <Link 
                    to={`/jobs/${job.id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {job.title}
                  </Link>
                </h3>
                <p className="text-gray-600 mb-2">
                  {job.employer_profiles?.company_name}
                </p>
              </div>

              {/* Match Score */}
              {job.match_score && (
                <div className="text-center ml-4">
                  <div className={`text-lg font-bold ${getMatchScoreColor(job.match_score)}`}>
                    {job.match_score}%
                  </div>
                  <div className="text-xs text-gray-500">Match</div>
                </div>
              )}
            </div>

            {/* Job Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-gray-600 text-sm">
                <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">
                  {job.location}{job.is_remote && ' (Remote)'}
                </span>
              </div>

              <div className="flex items-center text-gray-600 text-sm">
                <CurrencyDollarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>
              </div>

              <div className="flex items-center text-gray-600 text-sm">
                <ClockIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="capitalize">{job.employment_type?.replace('-', ' ')}</span>
              </div>

              <div className="flex items-center text-gray-600 text-sm">
                <CalendarDaysIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{timeAgo(job.created_at)}</span>
              </div>
            </div>

            {/* Job Description Preview */}
            {job.description && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                {job.description}
              </p>
            )}

            {/* Skills */}
            {job.skills_required && job.skills_required.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.slice(0, 4).map((skill, index) => (
                    <Badge key={index} variant="primary" size="sm">
                      {skill}
                    </Badge>
                  ))}
                  {job.skills_required.length > 4 && (
                    <Badge variant="default" size="sm">
                      +{job.skills_required.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Job Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              {job.views_count > 0 && (
                <div className="flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {job.views_count} views
                </div>
              )}
              {job.applications_count > 0 && (
                <div className="flex items-center">
                  <span>{job.applications_count} applicants</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSaved
                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {isSaved ? (
              <HeartSolidIcon className="h-4 w-4 mr-2" />
            ) : (
              <HeartIcon className="h-4 w-4 mr-2" />
            )}
            {isSaved ? 'Saved' : 'Save'}
          </button>

          <Button onClick={handleApply} size="sm">
            Apply Now
          </Button>
        </div>
      )}

      {/* Featured Badge */}
      {job.is_featured && (
        <div className="absolute top-4 right-4">
          <Badge variant="warning" size="sm">
            Featured
          </Badge>
        </div>
      )}
    </div>
  )
}

// Helper function for match score colors
function getMatchScoreColor(score) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}