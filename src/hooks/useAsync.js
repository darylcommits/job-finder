
// src/hooks/useAsync.js
import { useState, useEffect, useCallback } from 'react'

export function useAsync(asyncFunction, immediate = true) {
  const [status, setStatus] = useState('idle')
  const [value, setValue] = useState(null)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setStatus('pending')
    setValue(null)
    setError(null)

    try {
      const response = await asyncFunction(...args)
      setValue(response)
      setStatus('success')
      return response
    } catch (error) {
      setError(error)
      setStatus('error')
      throw error
    }
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return {
    execute,
    status,
    value,
    error,
    loading: status === 'pending'
  }
}