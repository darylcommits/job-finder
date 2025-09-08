// src/lib/utils.js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind CSS class merger
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format date
export function formatDate(date, options = {}) {
  if (!date) return ''
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options })
    .format(new Date(date))
}

// Format time
export function formatTime(date, options = {}) {
  if (!date) return ''
  
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options })
    .format(new Date(date))
}

// Format date and time together
export function formatDateTime(date, options = {}) {
  if (!date) return ''
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options })
    .format(new Date(date))
}

// Format time ago
export function timeAgo(date) {
  if (!date) return ''
  
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now - past) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`
  return `${Math.floor(diffInSeconds / 31536000)}y ago`
}

// Format salary range
export function formatSalary(min, max, currency = 'USD') {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
  
  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`
  }
  if (min) {
    return `${formatter.format(min)}+`
  }
  if (max) {
    return `Up to ${formatter.format(max)}`
  }
  return 'Salary not specified'
}

// Format currency
export function formatCurrency(amount, currency = 'USD') {
  if (!amount && amount !== 0) return 'Not specified'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format file size
export function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Validate email
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate initials from name
export function getInitials(name) {
  if (!name) return 'U'
  
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

// Generate random color for avatar
export function getAvatarColor(seed) {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500'
  ]
  
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

// Debounce function
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle function
export function throttle(func, wait) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, wait)
    }
  }
}

// Calculate match score between job seeker and job
export function calculateMatchScore(jobSeekerProfile, job) {
  let score = 0
  let maxScore = 0
  
  // Skills matching (40% weight)
  if (jobSeekerProfile.skills && job.skills_required) {
    const jobSeekerSkills = jobSeekerProfile.skills.map(s => s.toLowerCase())
    const requiredSkills = job.skills_required.map(s => s.toLowerCase())
    const matchedSkills = requiredSkills.filter(skill => jobSeekerSkills.includes(skill))
    
    score += (matchedSkills.length / requiredSkills.length) * 40
    maxScore += 40
  }
  
  // Experience matching (30% weight)
  if (jobSeekerProfile.experience_years && job.experience_required_min) {
    if (jobSeekerProfile.experience_years >= job.experience_required_min) {
      score += 30
    } else {
      const ratio = jobSeekerProfile.experience_years / job.experience_required_min
      score += ratio * 30
    }
    maxScore += 30
  }
  
  // Location matching (20% weight)
  if (jobSeekerProfile.preferred_locations && job.location) {
    const hasLocationMatch = jobSeekerProfile.preferred_locations.some(
      loc => loc.toLowerCase().includes(job.location.toLowerCase()) ||
             job.location.toLowerCase().includes(loc.toLowerCase())
    )
    if (hasLocationMatch || job.is_remote) {
      score += 20
    }
    maxScore += 20
  }
  
  // Employment type matching (10% weight)
  if (jobSeekerProfile.preferred_job_types && job.employment_type) {
    if (jobSeekerProfile.preferred_job_types.includes(job.employment_type)) {
      score += 10
    }
    maxScore += 10
  }
  
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
}

// File upload helpers
export function validateFileType(file, allowedTypes) {
  return allowedTypes.includes(file.type)
}

export function validateFileSize(file, maxSizeMB) {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

// Error handling
export function getErrorMessage(error) {
  if (error?.message) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred'
}

// Phone number formatting
export function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  
  return phone
}

// URL validation
export function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

// Truncate text
export function truncateText(text, maxLength = 100) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Capitalize first letter
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Convert camelCase to Title Case
export function camelToTitle(str) {
  if (!str) return ''
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
}

// Generate random ID
export function generateId(length = 8) {
  return Math.random().toString(36).substring(2, length + 2)
}

// Sleep/delay function
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Local storage helpers with error handling
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set: (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  
  remove: (key) => {
    try {
      window.localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  }
}