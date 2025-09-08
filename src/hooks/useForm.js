
// src/hooks/useForm.js
import { useState, useCallback } from 'react'

export function useForm(initialValues = {}, validationRules = {}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }, [errors])

  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }))
  }, [])

  const validateField = useCallback((name, value) => {
    const rule = validationRules[name]
    if (!rule) return null

    if (typeof rule === 'function') {
      return rule(value, values)
    }

    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return rule.message || `${name} is required`
    }

    if (rule.minLength && value && value.length < rule.minLength) {
      return rule.message || `${name} must be at least ${rule.minLength} characters`
    }

    if (rule.maxLength && value && value.length > rule.maxLength) {
      return rule.message || `${name} must be no more than ${rule.maxLength} characters`
    }

    if (rule.pattern && value && !rule.pattern.test(value)) {
      return rule.message || `${name} format is invalid`
    }

    if (rule.validate && typeof rule.validate === 'function') {
      return rule.validate(value, values)
    }

    return null
  }, [validationRules, values])

  const validate = useCallback(() => {
    const newErrors = {}
    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [validationRules, values, validateField])

  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target
    const fieldValue = type === 'checkbox' ? checked : value
    setValue(name, fieldValue)
  }, [setValue])

  const handleBlur = useCallback((event) => {
    const { name, value } = event.target
    setFieldTouched(name)
    
    const error = validateField(name, value)
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }, [setFieldTouched, validateField])

  const handleSubmit = useCallback((onSubmit) => {
    return async (event) => {
      if (event) {
        event.preventDefault()
      }

      setIsSubmitting(true)
      
      // Mark all fields as touched
      const touchedFields = {}
      Object.keys(values).forEach(key => {
        touchedFields[key] = true
      })
      setTouched(touchedFields)

      const isValid = validate()
      
      if (isValid) {
        try {
          await onSubmit(values)
        } catch (error) {
          console.error('Form submission error:', error)
        }
      }
      
      setIsSubmitting(false)
    }
  }, [values, validate])

  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setFieldTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    reset
  }
}
