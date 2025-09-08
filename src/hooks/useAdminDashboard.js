
// src/hooks/useAdminDashboard.js
import { useState, useEffect } from 'react'
import { supabase, TABLES } from '../lib/supabase'

export function useAdminDashboard() {
  const [dashboardData, setDashboardData] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch multiple data sources in parallel
      const [
        usersResult,
        jobsResult,
        reportsResult,
        verificationsResult
      ] = await Promise.all([
        supabase.from(TABLES.PROFILES).select('*', { count: 'exact', head: true }),
        supabase.from(TABLES.JOBS).select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from(TABLES.REPORTS).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from(TABLES.EMPLOYER_PROFILES).select('*', { count: 'exact', head: true }).eq('verification_status', 'pending')
      ])

      // Fetch recent activities
      const { data: recentActivities } = await supabase
        .from(TABLES.ACTIVITY_LOGS)
        .select(`
          *,
          profiles!activity_logs_user_id_fkey(full_name, role)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch pending jobs for approval
      const { data: pendingJobs } = await supabase
        .from(TABLES.JOBS)
        .select(`
          *,
          employer_profiles!inner(company_name)
        `)
        .eq('status', 'pending_approval')
        .limit(5)

      // Fetch pending employer verifications
      const { data: pendingEmployers } = await supabase
        .from(TABLES.EMPLOYER_PROFILES)
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .eq('verification_status', 'pending')
        .limit(5)

      setDashboardData({
        totalUsers: usersResult.count || 0,
        activeJobs: jobsResult.count || 0,
        pendingReports: reportsResult.count || 0,
        pendingVerifications: verificationsResult.count || 0,
        userGrowth: 12, // Mock data - calculate from time series
        jobGrowth: 8,
        reportChange: -5,
        verificationChange: 15,
        recentActivities: recentActivities || [],
        pendingJobs: pendingJobs || [],
        pendingEmployers: pendingEmployers || [],
        systemAlerts: [
          {
            id: 1,
            type: 'warning',
            message: 'Storage usage is at 85% capacity',
            timestamp: new Date().toISOString()
          },
          {
            id: 2,
            type: 'info',
            message: 'Weekly backup completed successfully',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          }
        ]
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return {
    dashboardData,
    loading,
    refreshData: fetchDashboardData
  }
}