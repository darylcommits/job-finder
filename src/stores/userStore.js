// src/stores/userStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, TABLES } from '../lib/supabase'

export const useUserStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      profile: null,
      preferences: {
        theme: 'light',
        notifications: true,
        jobAlerts: true,
        emailUpdates: true
      },
      recentJobs: [],
      searchHistory: [],
      savedFilters: {},

      // Actions
      setUser: (user) => set({ user }),
      
      setProfile: (profile) => set({ profile }),
      
      updateProfile: async (updates) => {
        const { profile } = get()
        if (!profile) return

        try {
          const { data, error } = await supabase
            .from(TABLES.PROFILES)
            .update(updates)
            .eq('id', profile.id)
            .select()
            .single()

          if (error) throw error
          
          set({ profile: { ...profile, ...data } })
          return { data, error: null }
        } catch (error) {
          console.error('Error updating profile:', error)
          return { data: null, error }
        }
      },

      updatePreferences: (newPreferences) => {
        set(state => ({
          preferences: { ...state.preferences, ...newPreferences }
        }))
      },

      addRecentJob: (job) => {
        set(state => ({
          recentJobs: [
            job,
            ...state.recentJobs.filter(j => j.id !== job.id)
          ].slice(0, 10) // Keep only last 10
        }))
      },

      addSearchHistory: (searchTerm) => {
        if (!searchTerm.trim()) return
        
        set(state => ({
          searchHistory: [
            searchTerm,
            ...state.searchHistory.filter(term => term !== searchTerm)
          ].slice(0, 20) // Keep only last 20 searches
        }))
      },

      clearSearchHistory: () => set({ searchHistory: [] }),

      saveFilter: (name, filter) => {
        set(state => ({
          savedFilters: {
            ...state.savedFilters,
            [name]: filter
          }
        }))
      },

      removeFilter: (name) => {
        set(state => {
          const { [name]: removed, ...rest } = state.savedFilters
          return { savedFilters: rest }
        })
      },

      clearUserData: () => set({
        user: null,
        profile: null,
        recentJobs: [],
        searchHistory: [],
        savedFilters: {}
      })
    }),
    {
      name: 'jobfinder-user-store',
      partialize: (state) => ({
        preferences: state.preferences,
        recentJobs: state.recentJobs,
        searchHistory: state.searchHistory,
        savedFilters: state.savedFilters
      })
    }
  )
)