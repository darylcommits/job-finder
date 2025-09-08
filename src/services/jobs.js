
// src/services/jobs.js
import { supabase, TABLES, JOB_STATUS, APPLICATION_STATUS, SWIPE_ACTIONS } from '../lib/supabase'
import apiService from './api'

class JobsService {
  async createJob(jobData) {
    try {
      const { data, error } = await apiService.create(TABLES.JOBS, {
        ...jobData,
        status: JOB_STATUS.PENDING_APPROVAL,
        created_at: new Date().toISOString()
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating job:', error)
      return { data: null, error }
    }
  }

  async getJobs(options = {}) {
    try {
      const defaultSelect = `
        *,
        employer_profiles!inner (
          company_name,
          company_logo_url,
          industry,
          company_description,
          verification_status
        )
      `

      const { data, error, count } = await apiService.findMany(TABLES.JOBS, {
        select: options.select || defaultSelect,
        filters: {
          status: JOB_STATUS.ACTIVE,
          ...options.filters
        },
        orderBy: options.orderBy || { column: 'created_at', ascending: false },
        limit: options.limit || 50,
        offset: options.offset || 0
      })

      if (error) throw error
      return { data, error: null, count }
    } catch (error) {
      console.error('Error getting jobs:', error)
      return { data: null, error, count: null }
    }
  }

  async getJobById(jobId) {
    try {
      const { data, error } = await apiService.findById(TABLES.JOBS, jobId, `
        *,
        employer_profiles!inner (
          company_name,
          company_logo_url,
          company_website,
          industry,
          company_description,
          company_size,
          founded_year,
          verification_status
        )
      `)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error getting job by id:', error)
      return { data: null, error }
    }
  }

  async getEmployerJobs(employerId, options = {}) {
    return await this.getJobs({
      ...options,
      filters: {
        employer_id: employerId,
        ...options.filters
      }
    })
  }

  async searchJobs(query, filters = {}) {
    try {
      let supabaseQuery = supabase
        .from(TABLES.JOBS)
        .select(`
          *,
          employer_profiles!inner (
            company_name,
            company_logo_url,
            industry,
            company_description
          )
        `)
        .eq('status', JOB_STATUS.ACTIVE)

      // Text search
      if (query) {
        supabaseQuery = supabaseQuery.textSearch('search_vector', query)
      }

      // Apply filters
      if (filters.location) {
        supabaseQuery = supabaseQuery.ilike('location', `%${filters.location}%`)
      }
      if (filters.employment_type) {
        supabaseQuery = supabaseQuery.eq('employment_type', filters.employment_type)
      }
      if (filters.salary_min) {
        supabaseQuery = supabaseQuery.gte('salary_min', filters.salary_min)
      }
      if (filters.remote_only) {
        supabaseQuery = supabaseQuery.eq('is_remote', true)
      }
      if (filters.skills) {
        supabaseQuery = supabaseQuery.overlaps('skills_required', filters.skills)
      }

      const { data, error } = await supabaseQuery
        .order('created_at', { ascending: false })
        .limit(filters.limit || 50)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error searching jobs:', error)
      return { data: null, error }
    }
  }

  async updateJob(jobId, updates) {
    try {
      const { data, error } = await apiService.update(TABLES.JOBS, jobId, {
        ...updates,
        updated_at: new Date().toISOString()
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating job:', error)
      return { data: null, error }
    }
  }

  async deleteJob(jobId) {
    try {
      const { error } = await apiService.delete(TABLES.JOBS, jobId)
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting job:', error)
      return { error }
    }
  }

  // Application methods
  async applyToJob(jobId, applicantId, applicationData = {}) {
    try {
      const { data, error } = await apiService.create(TABLES.APPLICATIONS, {
        job_id: jobId,
        applicant_id: applicantId,
        status: APPLICATION_STATUS.APPLIED,
        applied_via: 'direct',
        ...applicationData,
        created_at: new Date().toISOString()
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error applying to job:', error)
      return { data: null, error }
    }
  }

  async getApplications(options = {}) {
    try {
      const { data, error, count } = await apiService.findMany(TABLES.APPLICATIONS, {
        select: options.select || `
          *,
          jobs!inner (
            title,
            company_name,
            location,
            employment_type,
            employer_profiles!inner (
              company_name,
              company_logo_url
            )
          ),
          profiles!applications_applicant_id_fkey (
            full_name,
            avatar_url,
            job_seeker_profiles (
              skills,
              experience_years
            )
          )
        `,
        filters: options.filters,
        orderBy: options.orderBy || { column: 'created_at', ascending: false },
        limit: options.limit,
        offset: options.offset
      })

      if (error) throw error
      return { data, error: null, count }
    } catch (error) {
      console.error('Error getting applications:', error)
      return { data: null, error, count: null }
    }
  }

  async getJobSeekerApplications(applicantId, options = {}) {
    return await this.getApplications({
      ...options,
      filters: {
        applicant_id: applicantId,
        ...options.filters
      }
    })
  }

  async getJobApplications(jobId, options = {}) {
    return await this.getApplications({
      ...options,
      filters: {
        job_id: jobId,
        ...options.filters
      }
    })
  }

  async updateApplicationStatus(applicationId, status, notes = null) {
    try {
      const updates = {
        status,
        updated_at: new Date().toISOString()
      }

      if (notes) {
        updates.notes = notes
      }

      // Add timestamp for specific status changes
      switch (status) {
        case APPLICATION_STATUS.VIEWED:
          updates.viewed_at = new Date().toISOString()
          break
        case APPLICATION_STATUS.SHORTLISTED:
          updates.shortlisted_at = new Date().toISOString()
          break
        case APPLICATION_STATUS.OFFERED:
          updates.offered_at = new Date().toISOString()
          break
        case APPLICATION_STATUS.REJECTED:
          updates.rejected_at = new Date().toISOString()
          if (notes) updates.rejection_reason = notes
          break
      }

      const { data, error } = await apiService.update(TABLES.APPLICATIONS, applicationId, updates)
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating application status:', error)
      return { data: null, error }
    }
  }

  // Swipe methods
  async recordSwipe(swiperId, targetType, targetId, action) {
    try {
      const { data, error } = await apiService.create(TABLES.SWIPES, {
        swiper_id: swiperId,
        target_type: targetType,
        target_id: targetId,
        action,
        swiped_at: new Date().toISOString()
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error recording swipe:', error)
      return { data: null, error }
    }
  }

  async getSwipedJobs(userId) {
    try {
      const { data, error } = await apiService.findMany(TABLES.SWIPES, {
        select: 'target_id, action',
        filters: {
          swiper_id: userId,
          target_type: 'job'
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error getting swiped jobs:', error)
      return { data: null, error }
    }
  }

  // Save job methods
  async saveJob(userId, jobId) {
    try {
      const { data, error } = await apiService.create(TABLES.SAVED_ITEMS, {
        user_id: userId,
        item_type: 'job',
        item_id: jobId,
        saved_at: new Date().toISOString()
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error saving job:', error)
      return { data: null, error }
    }
  }

  async unsaveJob(userId, jobId) {
    try {
      const { error } = await supabase
        .from(TABLES.SAVED_ITEMS)
        .delete()
        .eq('user_id', userId)
        .eq('item_type', 'job')
        .eq('item_id', jobId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error unsaving job:', error)
      return { error }
    }
  }

  async getSavedJobs(userId, options = {}) {
    try {
      const { data, error, count } = await supabase
        .from(TABLES.SAVED_ITEMS)
        .select(`
          saved_at,
          jobs!inner (
            *,
            employer_profiles!inner (
              company_name,
              company_logo_url,
              industry
            )
          )
        `)
        .eq('user_id', userId)
        .eq('item_type', 'job')
        .order('saved_at', { ascending: false })
        .limit(options.limit || 50)

      if (error) throw error
      
      // Transform data to flatten job details
      const transformedData = data?.map(item => ({
        ...item.jobs,
        saved_at: item.saved_at
      }))

      return { data: transformedData, error: null, count }
    } catch (error) {
      console.error('Error getting saved jobs:', error)
      return { data: null, error, count: null }
    }
  }

  // Analytics methods
  async incrementJobView(jobId, viewerId = null) {
    try {
      // Record the view
      await apiService.create('job_views', {
        job_id: jobId,
        viewer_id: viewerId,
        viewed_at: new Date().toISOString()
      })

      return { error: null }
    } catch (error) {
      console.error('Error incrementing job view:', error)
      return { error }
    }
  }

  async getJobAnalytics(jobId) {
    try {
      const [viewsResult, applicationsResult] = await Promise.all([
        supabase
          .from('job_views')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', jobId),
        
        supabase
          .from(TABLES.APPLICATIONS)
          .select('status', { count: 'exact' })
          .eq('job_id', jobId)
      ])

      const totalViews = viewsResult.count || 0
      const applications = applicationsResult.data || []
      const totalApplications = applications.length

      // Count applications by status
      const applicationsByStatus = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1
        return acc
      }, {})

      return {
        data: {
          totalViews,
          totalApplications,
          applicationsByStatus,
          conversionRate: totalViews > 0 ? (totalApplications / totalViews * 100).toFixed(2) : 0
        },
        error: null
      }
    } catch (error) {
      console.error('Error getting job analytics:', error)
      return { data: null, error }
    }
  }
}

export default new JobsService()