
// src/components/jobs/JobSearch.jsx
import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useDebounce } from '../../hooks/useDebounce'
import Input from '../ui/Input'
import JobFilters from './JobFilters'

export default function JobSearch({ 
  onSearch, 
  onFiltersChange,
  filters = {},
  placeholder = "Search for jobs, companies, or keywords..." 
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 300)

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  // Auto-search on debounced query change
  useState(() => {
    if (debouncedQuery) {
      onSearch(debouncedQuery)
    }
  }, [debouncedQuery, onSearch])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={placeholder}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <JobFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </div>
      </form>

      {/* Active Filters Display */}
      {Object.values(filters).some(value => value && (Array.isArray(value) ? value.length > 0 : true)) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          {filters.location && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              📍 {filters.location}
              <button
                onClick={() => onFiltersChange({ ...filters, location: '' })}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.employment_type && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              💼 {filters.employment_type}
              <button
                onClick={() => onFiltersChange({ ...filters, employment_type: '' })}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.remote_only && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              🌐 Remote Only
              <button
                onClick={() => onFiltersChange({ ...filters, remote_only: false })}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}