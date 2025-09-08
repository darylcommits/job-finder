// src/hooks/useRealtime.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtime(table, callback, filters = {}) {
  const [channel, setChannel] = useState(null)

  useEffect(() => {
    const newChannel = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        ...filters
      }, callback)

    newChannel.subscribe()
    setChannel(newChannel)

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel)
      }
    }
  }, [table, callback, filters])

  return channel
}