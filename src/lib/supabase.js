// src/lib/supabase.js - Updated with all constants
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// User roles - matching your database schema
export const USER_ROLES = {
  JOB_SEEKER: 'job_seeker',
  EMPLOYER: 'employer',
  ADMIN: 'admin',
  INSTITUTION_PARTNER: 'institution_partner'
}

// Database table names - matching your actual schema
export const TABLES = {
  PROFILES: 'profiles',
  JOB_SEEKER_PROFILES: 'job_seeker_profiles',
  EMPLOYER_PROFILES: 'employer_profiles',
  INSTITUTION_PARTNERS: 'institution_partners',
  JOBS: 'jobs',
  APPLICATIONS: 'applications',
  SAVED_ITEMS: 'saved_items',
  SWIPES: 'swipes',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  USER_SETTINGS: 'user_settings',
  JOB_PREFERENCES: 'job_preferences',
  SUBSCRIPTIONS: 'subscriptions',
  PAYMENTS: 'payments',
  REPORTS: 'reports',
  BLOCKED_USERS: 'blocked_users',
  PROFILE_VIEWS: 'profile_views',
  JOB_VIEWS: 'job_views',
  SEARCH_HISTORY: 'search_history',
  ACTIVITY_LOGS: 'activity_logs',
  COMPANY_REVIEWS: 'company_reviews'
}

// Employment types - matching your database enum
export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  REMOTE: 'remote',
  HYBRID: 'hybrid'
}

// Job statuses - matching your database enum
export const JOB_STATUSES = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CLOSED: 'closed',
  EXPIRED: 'expired'
}

// Application statuses - matching your database enum
export const APPLICATION_STATUSES = {
  APPLIED: 'applied',
  VIEWED: 'viewed',
  SHORTLISTED: 'shortlisted',
  INTERVIEW: 'interview',
  OFFERED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
}

// Verification statuses
export const VERIFICATION_STATUSES = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
}

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
}

// Notification types
export const NOTIFICATION_TYPES = {
  APPLICATION: 'application',
  MATCH: 'match',
  MESSAGE: 'message',
  SYSTEM: 'system',
  MARKETING: 'marketing'
}

// Swipe actions
export const SWIPE_ACTIONS = {
  LIKE: 'like',
  PASS: 'pass',
  SUPERLIKE: 'superlike'
}

// Helper function to handle Supabase errors
export function handleSupabaseError(error) {
  console.error('Supabase error:', error)
  
  if (error.code === 'PGRST116') {
    return 'Record not found'
  }
  
  if (error.code === '23505') {
    return 'This record already exists'
  }
  
  if (error.code === 'PGRST301') {
    return 'Permission denied'
  }
  
  if (error.code === '42501') {
    return 'Insufficient privileges'
  }
  
  return error.message || 'An unexpected error occurred'
}

// Helper function to get user's role-specific profile
export async function getRoleSpecificProfile(userId, role) {
  let tableName
  
  switch (role) {
    case USER_ROLES.JOB_SEEKER:
      tableName = TABLES.JOB_SEEKER_PROFILES
      break
    case USER_ROLES.EMPLOYER:
      tableName = TABLES.EMPLOYER_PROFILES
      break
    case USER_ROLES.INSTITUTION_PARTNER:
      tableName = TABLES.INSTITUTION_PARTNERS
      break
    default:
      return null
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching ${role} profile:`, error)
    return null
  }

  return data
}