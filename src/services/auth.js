// src/services/auth.js
import { supabase, TABLES, USER_ROLES } from '../lib/supabase'
import apiService from './api'

class AuthService {
  async signUp(email, password, userData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      if (error) throw error

      if (data.user) {
        // Create profile in database
        const profileData = {
          id: data.user.id,
          email: data.user.email,
          role: userData.role || USER_ROLES.JOB_SEEKER,
          full_name: userData.full_name || data.user.user_metadata?.full_name,
          ...userData
        }

        await this.createProfile(data.user, profileData)
      }

      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return { data: null, error }
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  }

  async resetPassword(email, redirectTo = null) {
    try {
      const options = {}
      if (redirectTo) {
        options.redirectTo = redirectTo
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, options)
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Reset password error:', error)
      return { error }
    }
  }

  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Update password error:', error)
      return { error }
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { data: user, error: null }
    } catch (error) {
      console.error('Get current user error:', error)
      return { data: null, error }
    }
  }

  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return { data: session, error: null }
    } catch (error) {
      console.error('Get current session error:', error)
      return { data: null, error }
    }
  }

  async createProfile(user, userData) {
    try {
      // Create main profile
      await apiService.create(TABLES.PROFILES, {
        id: user.id,
        email: user.email,
        role: userData.role || USER_ROLES.JOB_SEEKER,
        full_name: userData.full_name,
        phone: userData.phone,
        location: userData.location,
        bio: userData.bio,
        headline: userData.headline
      })

      // Create role-specific profile
      switch (userData.role) {
        case USER_ROLES.JOB_SEEKER:
          await this.createJobSeekerProfile(user.id, userData)
          break
        case USER_ROLES.EMPLOYER:
          await this.createEmployerProfile(user.id, userData)
          break
        case USER_ROLES.INSTITUTION_PARTNER:
          await this.createInstitutionProfile(user.id, userData)
          break
      }

      // Create default settings
      await this.createDefaultSettings(user.id)

      return { error: null }
    } catch (error) {
      console.error('Error creating profile:', error)
      return { error }
    }
  }

  async createJobSeekerProfile(userId, userData) {
    return await apiService.create(TABLES.JOB_SEEKER_PROFILES, {
      user_id: userId,
      skills: userData.skills || [],
      experience_years: userData.experience_years || 0,
      education_level: userData.education_level,
      expected_salary_min: userData.expected_salary_min,
      expected_salary_max: userData.expected_salary_max,
      preferred_locations: userData.preferred_locations || [],
      preferred_job_types: userData.preferred_job_types || []
    })
  }

  async createEmployerProfile(userId, userData) {
    return await apiService.create(TABLES.EMPLOYER_PROFILES, {
      user_id: userId,
      company_name: userData.company_name || '',
      company_website: userData.company_website,
      company_size: userData.company_size,
      industry: userData.industry || '',
      company_description: userData.company_description || '',
      founded_year: userData.founded_year
    })
  }

  async createInstitutionProfile(userId, userData) {
    return await apiService.create(TABLES.INSTITUTION_PARTNERS, {
      user_id: userId,
      institution_name: userData.institution_name || '',
      institution_type: userData.institution_type || '',
      institution_website: userData.institution_website,
      contact_person: userData.contact_person || '',
      contact_email: userData.contact_email,
      contact_phone: userData.contact_phone
    })
  }

  async createDefaultSettings(userId) {
    return await apiService.create(TABLES.USER_SETTINGS, {
      user_id: userId,
      email_notifications: true,
      push_notifications: false,
      sms_notifications: false,
      job_alert_frequency: 'daily',
      newsletter_subscription: true,
      profile_visibility: 'public',
      data_sharing: false,
      language: 'en',
      timezone: 'UTC'
    })
  }

  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select(`
          *,
          job_seeker_profiles (*),
          employer_profiles (*),
          institution_partners (*),
          user_settings (*),
          subscriptions (*)
        `)
        .eq('id', userId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error getting profile:', error)
      return { data: null, error }
    }
  }

  async updateProfile(userId, updates) {
    try {
      const { data, error } = await apiService.update(TABLES.PROFILES, userId, {
        ...updates,
        updated_at: new Date().toISOString()
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { data: null, error }
    }
  }

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export default new AuthService()