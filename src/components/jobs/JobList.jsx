
// src/components/jobs/JobList.jsx
import { useState } from 'react'
import JobCard from './JobCard'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'

export default function JobList({ 
  jobs, 
  loading, 
  hasMore, 
  onLoadMore, 
  onSaveJob, 
  onApplyJob,
  savedJobs = [],
  emptyMessage = "No jobs found"
}) {
  const [loadingMore, setLoadingMore] = useState(false)

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    await onLoadMore?.()
    setLoadingMore(false)
  }

  if (loading && jobs.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading jobs..." />
      </div>
    )
  }

  if (!loading && jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <svg 
            className="mx-auto h-24 w-24 text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0v6a2 2 0 002 2v10l4-2 4 2V10a2 2 0 002-2V6" 
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {emptyMessage}
          </h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or check back later for new opportunities.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Job Cards */}
      <div className="grid grid-cols-1 gap-6">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isSaved={savedJobs.includes(job.id)}
            onSave={onSaveJob}
            onApply={onApplyJob}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-8">
          <Button
            onClick={handleLoadMore}
            loading={loadingMore}
            variant="outline"
          >
            {loadingMore ? 'Loading...' : 'Load More Jobs'}
          </Button>
        </div>
      )}
    </div>
  )
}