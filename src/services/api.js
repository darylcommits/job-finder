// src/services/api.js
import { supabase, TABLES } from '../lib/supabase'

class ApiService {
  // Generic CRUD operations
  async create(table, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert([data])
        .select()
        .single()

      if (error) throw error
      return { data: result, error: null }
    } catch (error) {
      console.error(`Error creating ${table}:`, error)
      return { data: null, error }
    }
  }

  async findById(table, id, select = '*') {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error(`Error finding ${table} by id:`, error)
      return { data: null, error }
    }
  }

  async findMany(table, options = {}) {
    try {
      let query = supabase.from(table)

      if (options.select) {
        query = query.select(options.select)
      } else {
        query = query.select('*')
      }

      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else if (typeof value === 'object' && value.operator) {
            switch (value.operator) {
              case 'gte':
                query = query.gte(key, value.value)
                break
              case 'lte':
                query = query.lte(key, value.value)
                break
              case 'like':
                query = query.ilike(key, value.value)
                break
              case 'not':
                query = query.neq(key, value.value)
                break
              default:
                query = query.eq(key, value.value)
            }
          } else {
            query = query.eq(key, value)
          }
        })
      }

      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        })
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error
      return { data, error: null, count }
    } catch (error) {
      console.error(`Error finding ${table}:`, error)
      return { data: null, error, count: null }
    }
  }

  async update(table, id, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data: result, error: null }
    } catch (error) {
      console.error(`Error updating ${table}:`, error)
      return { data: null, error }
    }
  }

  async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error(`Error deleting ${table}:`, error)
      return { error }
    }
  }

  // File upload operations
  async uploadFile(bucket, path, file) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      return { data: { ...data, publicUrl }, error: null }
    } catch (error) {
      console.error('Error uploading file:', error)
      return { data: null, error }
    }
  }

  async deleteFile(bucket, path) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting file:', error)
      return { error }
    }
  }

  // Real-time subscriptions
  subscribe(table, callback, filters = {}) {
    let channel = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        ...filters
      }, callback)

    channel.subscribe()
    return channel
  }

  unsubscribe(channel) {
    supabase.removeChannel(channel)
  }
}

export default new ApiService()
