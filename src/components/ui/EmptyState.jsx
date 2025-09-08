
// src/components/ui/EmptyState.jsx
import { 
  BriefcaseIcon,
  UserGroupIcon,
  DocumentTextIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import Button from './Button'

const emptyStateConfig = {
  jobs: {
    icon: BriefcaseIcon,
    title: 'No jobs found',
    description: 'Try adjusting your search criteria or check back later for new opportunities.',
    action: 'Browse All Jobs'
  },
  applications: {
    icon: DocumentTextIcon,
    title: 'No applications yet',
    description: 'Start applying to jobs that match your skills and interests.',
    action: 'Find Jobs'
  },
  candidates: {
    icon: UserGroupIcon,
    title: 'No candidates found',
    description: 'Adjust your search filters or post a new job to attract candidates.',
    action: 'Post a Job'
  },
  saved: {
    icon: HeartIcon,
    title: 'No saved jobs',
    description: 'Save jobs you\'re interested in to easily find them later.',
    action: 'Explore Jobs'
  }
}

export default function EmptyState({ 
  type = 'jobs', 
  title, 
  description, 
  action, 
  onAction,
  icon: CustomIcon,
  children 
}) {
  const config = emptyStateConfig[type] || emptyStateConfig.jobs
  const Icon = CustomIcon || config.icon

  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <Icon className="mx-auto h-24 w-24 text-gray-400 mb-6" />
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {title || config.title}
        </h3>
        <p className="text-gray-600 mb-6">
          {description || config.description}
        </p>
        
        {children || (action || config.action) && onAction && (
          <Button onClick={onAction}>
            {action || config.action}
          </Button>
        )}
      </div>
    </div>
  )
}
