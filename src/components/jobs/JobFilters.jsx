
// src/components/jobs/JobFilters.jsx
import { useState } from 'react'
import { 
  FunnelIcon, 
  XMarkIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { EMPLOYMENT_TYPES, SALARY_RANGES } from '../../lib/constants'

export default function JobFilters({ filters, onFiltersChange, onClear }) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      location: '',
      employment_type: '',
      salary_min: '',
      salary_max: '',
      remote_only: false,
      skills: []
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    onClear?.()
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value && (Array.isArray(value) ? value.length > 0 : true)
  )

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <FunnelIcon className="h-4 w-4 mr-2" />
        Filters
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-600 rounded-full"></span>
        )}
      </Button>

      {/* Filter Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Filter Panel */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Filter Controls */}
              <div className="space-y-4">
                {/* Location */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    Location
                  </label>
                  <Input
                    placeholder="Enter city or state"
                    value={localFilters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  />
                </div>

                {/* Employment Type */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <BriefcaseIcon className="h-4 w-4 mr-2" />
                    Job Type
                  </label>
                  <Select
                    placeholder="Select job type"
                    value={localFilters.employment_type}
                    onChange={(e) => handleFilterChange('employment_type', e.target.value)}
                    options={[
                      { value: '', label: 'All Types' },
                      ...EMPLOYMENT_TYPES.map(type => ({
                        value: type.value,
                        label: type.label
                      }))
                    ]}
                  />
                </div>

                {/* Salary Range */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Salary Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={localFilters.salary_min}
                      onChange={(e) => handleFilterChange('salary_min', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={localFilters.salary_max}
                      onChange={(e) => handleFilterChange('salary_max', e.target.value)}
                    />
                  </div>
                </div>

                {/* Remote Only */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localFilters.remote_only}
                      onChange={(e) => handleFilterChange('remote_only', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                    />
                    <span className="text-sm text-gray-700">Remote jobs only</span>
                  </label>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </label>
                  <Input
                    placeholder="Enter skills (comma-separated)"
                    value={Array.isArray(localFilters.skills) ? localFilters.skills.join(', ') : ''}
                    onChange={(e) => {
                      const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      handleFilterChange('skills', skills)
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex-1"
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="flex-1"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
