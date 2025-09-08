
// src/hooks/useAnalytics.js
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, TABLES, USER_ROLES } from '../lib/supabase'

export function useAnalytics(timeRange = '30d') {
  const { profile } = useAuth()
  const [analytics, setAnalytics] = useState({})
  const [loading, setLoading] = useState(false)

  const fetchAnalytics = async () => {
    if (!profile?.id) return

    try {
      setLoading(true)
      
      let analyticsData = {}
      
      switch (profile.role) {
        case USER_ROLES.ADMIN:
          analyticsData = await fetchAdminAnalytics(timeRange)
          break
        case USER_ROLES.EMPLOYER:
          analyticsData = await fetchEmployerAnalytics(profile.id, timeRange)
          break
        case USER_ROLES.JOB_SEEKER:
          analyticsData = await fetchJobSeekerAnalytics(profile.id, timeRange)
          break
        case USER_ROLES.INSTITUTION_PARTNER:
          analyticsData = await fetchInstitutionAnalytics(profile.id, timeRange)
          break
      }
      
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    analytics,
    loading,
    fetchAnalytics
  }
}

// Analytics fetcher functions
async function fetchAdminAnalytics(timeRange) {
  const dateFilter = getDateFilter(timeRange)
  
  const [
    usersResult,
    jobsResult,
    applicationsResult
  ] = await Promise.all([
    supabase.from(TABLES.PROFILES).select('*', { count: 'exact', head: true }),
    supabase.from(TABLES.JOBS).select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from(TABLES.APPLICATIONS).select('*', { count: 'exact', head: true })
  ])

  return {
    totalUsers: usersResult.count || 0,
    activeJobs: jobsResult.count || 0,
    totalApplications: applicationsResult.count || 0,
    userGrowth: 12, // Mock data - calculate from time series
    jobGrowth: 8,
    applicationGrowth: 25,
    matchSuccessRate: 78,
    matchRateChange: 5
  }
}

async function fetchEmployerAnalytics(employerId, timeRange) {
  const [
    jobsResult,
    applicationsResult
  ] = await Promise.all([
    supabase.from(TABLES.JOBS).select('*', { count: 'exact', head: true }).eq('employer_id', employerId),
    supabase.from(TABLES.APPLICATIONS).select('*, jobs!inner(*)').eq('jobs.employer_id', employerId)
  ])

  return {
    activeJobs: jobsResult.count || 0,
    totalApplications: applicationsResult.data?.length || 0,
    profileViews: 1250, // Mock data
    hireRate: 15,
    jobGrowth: 10,
    applicationGrowth: 18,
    viewsGrowth: 22,
    hireRateChange: 3
  }
}

async function fetchJobSeekerAnalytics(userId, timeRange) {
  const applicationsResult = await supabase
    .from(TABLES.APPLICATIONS)
    .select('*')
    .eq('applicant_id', userId)

  return {
    applicationsSent: applicationsResult.data?.length || 0,
    profileViews: 45, // Mock data
    jobsSaved: 12,
    responseRate: 25,
    applicationGrowth: 15,
    viewsGrowth: 8,
    savedGrowth: 20,
    responseRateChange: 5
  }
}

async function fetchInstitutionAnalytics(institutionId, timeRange) {
  // Mock data for institution analytics
  return {
    totalStudents: 150,
    placements: 89,
    placementRate: 75,
    partnerCompanies: 25,
    studentGrowth: 12,
    placementGrowth: 18,
    placementRateChange: 5,
    partnerGrowth: 8
  }
}

function getDateFilter(timeRange) {
  const now = new Date()
  const days = parseInt(timeRange.replace('d', ''))
  const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
  return startDate.toISOString()
}