
// src/hooks/useSupabase.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSupabase() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = async (operation) => {
    try {
      setLoading(true)
      setError(null)
      const result = await operation()
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    execute,
    supabase
  }
}