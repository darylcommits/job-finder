
// src/components/ui/Pagination.jsx
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline'
import { usePagination } from '../../hooks/usePagination'
import Button from './Button'

export default function Pagination({ 
  totalItems, 
  itemsPerPage = 10, 
  currentPage, 
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  className = ''
}) {
  const {
    paginationRange,
    hasNext,
    hasPrevious,
    goToNext,
    goToPrevious,
    goToFirst,
    goToLast,
    totalPages
  } = usePagination({
    totalItems,
    itemsPerPage,
    initialPage: currentPage
  })

  const handlePageChange = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page)
    }
  }

  if (totalPages <= 1) return null

  return (
    <nav className={`flex items-center justify-between ${className}`}>
      <div className="flex-1 flex justify-between sm:hidden">
        {/* Mobile pagination */}
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!hasPrevious}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNext}
        >
          Next
        </Button>
      </div>

      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-medium">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{' '}
            of{' '}
            <span className="font-medium">{totalItems}</span>{' '}
            results
          </p>
        </div>
        
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {/* First page button */}
            {showFirstLast && (
              <button
                onClick={() => handlePageChange(1)}
                disabled={!hasPrevious}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDoubleLeftIcon className="h-5 w-5" />
              </button>
            )}

            {/* Previous page button */}
            {showPrevNext && (
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevious}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                  !showFirstLast ? 'rounded-l-md' : ''
                }`}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            )}

            {/* Page numbers */}
            {paginationRange.map((pageNumber, index) => {
              if (pageNumber === '...') {
                return (
                  <span
                    key={index}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                )
              }

              return (
                <button
                  key={index}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageNumber === currentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              )
            })}

            {/* Next page button */}
            {showPrevNext && (
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNext}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                  !showFirstLast ? 'rounded-r-md' : ''
                }`}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            )}

            {/* Last page button */}
            {showFirstLast && (
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={!hasNext}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDoubleRightIcon className="h-5 w-5" />
              </button>
            )}
          </nav>
        </div>
      </div>
    </nav>
  )
}
