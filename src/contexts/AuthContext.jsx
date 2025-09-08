// src/contexts/AuthContext.jsx - Fixed to prevent loading stuck on reload
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, TABLES, USER_ROLES } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  // Initialize auth state with timeout protection
  useEffect(() => {
    let mounted = true
    let timeoutId

    const initializeAuth = async () => {
      try {
        // Set a maximum timeout for initialization
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Auth initialization timeout, proceeding without profile')
            setLoading(false)
            setInitializing(false)
          }
        }, 10000) // 10 second timeout

        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('Error getting session:', error)
          toast.error('Authentication error')
          setLoading(false)
          setInitializing(false)
          return
        }
        
        if (session?.user) {
          setUser(session.user)
          // Fetch profile but don't block initialization if it fails
          fetchProfile(session.user.id).finally(() => {
            if (mounted) {
              setLoading(false)
              setInitializing(false)
            }
          })
        } else {
          setLoading(false)
          setInitializing(false)
        }

        // Clear timeout if we reach here successfully
        if (timeoutId) clearTimeout(timeoutId)

      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setLoading(false)
          setInitializing(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth event:', event, session?.user?.id)
        
        if (session?.user) {
          setUser(session.user)
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Don't block the UI for profile fetching on auth events
            fetchProfile(session.user.id)
          }
        } else {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  // Simplified profile fetching with better error handling and timeout
  const fetchProfile = async (userId, retryCount = 0) => {
    try {
      console.log('🔍 Fetching profile for user:', userId, 'Retry:', retryCount)
      
      // Set a timeout for profile fetching
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      // Create a basic fallback profile immediately
      const fallbackProfile = {
        id: userId,
        email: user?.email || '',
        role: user?.user_metadata?.role || USER_ROLES.JOB_SEEKER,
        full_name: user?.user_metadata?.full_name || '',
        profile_completion: 20,
        is_verified: user?.email_confirmed_at ? true : false
      }

      try {
        // Try to fetch the actual profile
        const { data: profileData, error: profileError } = await supabase
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
          .abortSignal(controller.signal)
          .maybeSingle()

        clearTimeout(timeoutId)

        if (profileError) {
          console.warn('Profile fetch error:', profileError)
          
          // If it's a permission error and we haven't retried much, try basic fetch
          if (profileError.code === 'PGRST301' && retryCount < 2) {
            console.log('⏳ Permission error, trying basic fetch...')
            return fetchBasicProfile(userId, retryCount + 1)
          }
          
          // Use fallback profile
          console.log('Using fallback profile due to error')
          setProfile(fallbackProfile)
          return
        }

        if (profileData) {
          console.log('✅ Profile loaded successfully')
          setProfile(profileData)
        } else {
          // No profile found, try basic fetch or use fallback
          if (retryCount < 2) {
            console.log('No profile found, trying basic fetch...')
            return fetchBasicProfile(userId, retryCount + 1)
          } else {
            console.log('Using fallback profile - no profile found')
            setProfile(fallbackProfile)
          }
        }

      } catch (fetchError) {
        clearTimeout(timeoutId)
        
        if (fetchError.name === 'AbortError') {
          console.warn('Profile fetch timed out, using fallback')
          setProfile(fallbackProfile)
          return
        }
        
        throw fetchError
      }

    } catch (error) {
      console.error('❌ Error in fetchProfile:', error)
      
      // Always set some profile to prevent infinite loading
      const fallbackProfile = {
        id: userId,
        email: user?.email || '',
        role: user?.user_metadata?.role || USER_ROLES.JOB_SEEKER,
        full_name: user?.user_metadata?.full_name || '',
        profile_completion: 10,
        is_verified: false
      }
      
      setProfile(fallbackProfile)
      
      // Only show error after multiple retries
      if (retryCount >= 2) {
        toast.error('Failed to load complete profile. Some features may be limited.')
      }
    }
  }

  // Basic profile fetch fallback
  const fetchBasicProfile = async (userId, retryCount = 0) => {
    try {
      console.log('🔍 Fetching basic profile for user:', userId)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const { data: basicProfile, error: basicError } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .maybeSingle()

      clearTimeout(timeoutId)

      if (basicError) {
        console.warn('Basic profile fetch error:', basicError)
        throw basicError
      }

      if (basicProfile) {
        console.log('✅ Basic profile loaded')
        setProfile(basicProfile)
      } else {
        // Still no profile, create fallback
        const fallbackProfile = {
          id: userId,
          email: user?.email || '',
          role: user?.user_metadata?.role || USER_ROLES.JOB_SEEKER,
          full_name: user?.user_metadata?.full_name || '',
          profile_completion: 10,
          is_verified: false
        }
        setProfile(fallbackProfile)
      }

    } catch (error) {
      console.error('Basic profile fetch failed:', error)
      
      // Always provide a fallback
      const fallbackProfile = {
        id: userId,
        email: user?.email || '',
        role: user?.user_metadata?.role || USER_ROLES.JOB_SEEKER,
        full_name: user?.user_metadata?.full_name || '',
        profile_completion: 5,
        is_verified: false
      }
      setProfile(fallbackProfile)
    }
  }

  // Enhanced signup with better error handling
  const signUp = async (email, password, userData) => {
    try {
      setLoading(true)
      console.log('🚀 Starting signup process...')
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role
          }
        }
      })

      if (authError) {
        console.error('❌ Auth error:', authError)
        throw authError
      }

      // Check if user already exists
      if (authData.user && !authData.user.identities?.length) {
        toast.info('User already exists. Please sign in instead.')
        return { data: authData, error: null }
      }

      if (authData.user) {
        console.log('📝 Creating profile...')
        
        try {
          const { data: functionResult, error: functionError } = await supabase.rpc(
            'create_user_profile_secure',
            {
              p_user_id: authData.user.id,
              p_email: authData.user.email,
              p_role: userData.role || USER_ROLES.JOB_SEEKER,
              p_full_name: userData.full_name || '',
              p_phone: userData.phone || null,
              p_location: userData.location || null,
              p_company_name: userData.company_name || null,
              p_industry: userData.industry || null,
              p_institution_name: userData.institution_name || null,
              p_institution_type: userData.institution_type || null,
              p_contact_person: userData.contact_person || null,
              p_skills: userData.skills || [],
              p_experience_years: userData.experience_years ? parseInt(userData.experience_years) : null,
              p_expected_salary_min: userData.expected_salary_min ? parseInt(userData.expected_salary_min) : null,
              p_expected_salary_max: userData.expected_salary_max ? parseInt(userData.expected_salary_max) : null
            }
          )

          if (functionError || (functionResult && !functionResult.success)) {
            console.warn('Profile creation via function failed, will create on first login')
          }
        } catch (profileError) {
          console.warn('Profile creation failed, will retry on login:', profileError)
        }

        // Set basic profile immediately
        setProfile({
          id: authData.user.id,
          email: authData.user.email,
          role: userData.role || USER_ROLES.JOB_SEEKER,
          full_name: userData.full_name || '',
          profile_completion: 30,
          is_verified: false
        })
        
        toast.success('Account created successfully! Please check your email to verify your account.')
      }

      return { data: authData, error: null }
    } catch (error) {
      console.error('❌ Sign up error:', error)
      toast.error(error.message || 'Failed to create account')
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      toast.success('Welcome back!')
      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error(error.message || 'Failed to sign in')
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setProfile(null)
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) throw error
      
      toast.success('Password reset email sent!')
      return { error: null }
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error(error.message || 'Failed to send reset email')
      return { error }
    }
  }

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      toast.success('Password updated successfully')
      return { error: null }
    } catch (error) {
      console.error('Update password error:', error)
      toast.error(error.message || 'Failed to update password')
      return { error }
    }
  }

  const updateProfile = async (updates) => {
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from(TABLES.PROFILES)
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      await fetchProfile(user.id)
      toast.success('Profile updated successfully')
      
      return { error: null }
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('Failed to update profile')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (role) => {
    return profile?.role === role
  }

  const hasAnyRole = (roles) => {
    return roles.includes(profile?.role)
  }

  const isProfileComplete = () => {
    if (!profile) return false
    return profile.profile_completion >= 80
  }

  // Manual refresh function
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    initializing,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
    hasRole,
    hasAnyRole,
    isProfileComplete
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}