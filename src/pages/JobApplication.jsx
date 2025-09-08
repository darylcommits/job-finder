// src/pages/JobApplication.jsx - Comprehensive job application form
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  ArrowUpTrayIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

import { useAuth } from '../contexts/AuthContext'
import { supabase, TABLES, USER_ROLES } from '../lib/supabase'
import { formatSalary, formatDate } from '../lib/utils'

export default function JobApplication() {
  const { jobId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [existingApplication, setExistingApplication] = useState(null)

  const [formData, setFormData] = useState({
    // Personal Information
    full_name: '',
    career_objectives: '',
    birthdate: '',
    address: '',
    contact_number: '',
    email: '',
    
    // Education
    college_degree: '',
    year_graduated: '',
    school_attended: '',
    
    // Work Experience (allowing multiple entries)
    work_experiences: [{
      position: '',
      previous_employer: '',
      duration: '',
      duties_responsibilities: ''
    }],
    
    // Cover Letter & Additional Info
    cover_letter: '',
    additional_notes: '',
    
    // File URLs (will be populated after upload)
    otr_url: '',
    diploma_url: '',
    id_url: '',
    resume_url: ''
  })

  const [uploadProgress, setUploadProgress] = useState({
    otr: { uploading: false, uploaded: false },
    diploma: { uploading: false, uploaded: false },
    id: { uploading: false, uploaded: false },
    resume: { uploading: false, uploaded: false }
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (profile?.role !== USER_ROLES.JOB_SEEKER) {
      navigate('/dashboard')
      return
    }
    
    if (jobId) {
      fetchJobDetails()
      checkExistingApplication()
      loadProfileData()
    }
  }, [jobId, profile])

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.JOBS || 'jobs')
        .select(`
          *,
          employer_profiles:employer_id (
            company_name,
            company_logo_url,
            industry
          )
        `)
        .eq('id', jobId)
        .eq('status', 'active')
        .single()

      if (error) throw error
      setJob(data)
    } catch (error) {
      console.error('Error fetching job:', error)
      toast.error('Job not found or no longer available')
      navigate('/jobs')
    } finally {
      setLoading(false)
    }
  }

  const checkExistingApplication = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.APPLICATIONS || 'applications')
        .select('*')
        .eq('job_id', jobId)
        .eq('applicant_id', profile.id)
        .single()

      if (data) {
        setExistingApplication(data)
        // If they have already applied, we could redirect or show a message
      }
    } catch (error) {
      // No existing application, which is fine
    }
  }

  const loadProfileData = async () => {
    try {
      // Load existing profile data to pre-fill form
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single()

      const { data: jobSeekerData, error: jobSeekerError } = await supabase
        .from('job_seeker_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .single()

      if (profileData) {
        setFormData(prev => ({
          ...prev,
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          contact_number: profileData.phone || '',
          address: profileData.location || ''
        }))
      }

      if (jobSeekerData) {
        setFormData(prev => ({
          ...prev,
          career_objectives: jobSeekerData.bio || '',
          college_degree: jobSeekerData.education_level || '',
          resume_url: jobSeekerData.resume_url || ''
        }))
      }
    } catch (error) {
      console.warn('Error loading profile data:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleWorkExperienceChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      work_experiences: prev.work_experiences.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      work_experiences: [...prev.work_experiences, {
        position: '',
        previous_employer: '',
        duration: '',
        duties_responsibilities: ''
      }]
    }))
  }

  const removeWorkExperience = (index) => {
    if (formData.work_experiences.length > 1) {
      setFormData(prev => ({
        ...prev,
        work_experiences: prev.work_experiences.filter((_, i) => i !== index)
      }))
    }
  }

  const handleFileUpload = async (file, type) => {
    if (!file) return

    try {
      setUploadProgress(prev => ({
        ...prev,
        [type]: { uploading: true, uploaded: false }
      }))

      // Validate file
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB')
      }

      // Allowed file types for documents
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload PDF, DOC, DOCX, or image files.')
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}/applications/${jobId}/${type}-${Date.now()}.${fileExt}`

      // Upload file
      const { data, error } = await supabase.storage
        .from('job-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('job-media')
        .getPublicUrl(fileName)

      // Update form data
      setFormData(prev => ({
        ...prev,
        [`${type}_url`]: publicUrl
      }))

      setUploadProgress(prev => ({
        ...prev,
        [type]: { uploading: false, uploaded: true }
      }))

      toast.success(`${type.toUpperCase()} uploaded successfully!`)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(`Upload failed: ${error.message}`)
      setUploadProgress(prev => ({
        ...prev,
        [type]: { uploading: false, uploaded: false }
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Required fields
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.contact_number.trim()) newErrors.contact_number = 'Contact number is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.birthdate) newErrors.birthdate = 'Birthdate is required'
    if (!formData.career_objectives.trim()) newErrors.career_objectives = 'Career objectives are required'

    // Education
    if (!formData.college_degree.trim()) newErrors.college_degree = 'College degree is required'
    if (!formData.year_graduated.trim()) newErrors.year_graduated = 'Year graduated is required'
    if (!formData.school_attended.trim()) newErrors.school_attended = 'School attended is required'

    // At least one work experience
    const hasValidWorkExp = formData.work_experiences.some(exp => 
      exp.position.trim() && exp.previous_employer.trim()
    )
    if (!hasValidWorkExp) {
      newErrors.work_experience = 'At least one work experience is required'
    }

    // File uploads
    if (!formData.resume_url) newErrors.resume = 'Resume is required'
    if (!formData.id_url) newErrors.id = 'Valid ID is required'

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (existingApplication) {
      toast.error('You have already applied to this job')
      return
    }

    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting')
      return
    }

    try {
      setSubmitting(true)

      // Prepare application data
      const applicationData = {
        job_id: jobId,
        applicant_id: profile.id,
        status: 'applied',
        cover_letter: formData.cover_letter,
        
        // Store all the detailed application data as JSON
        custom_responses: {
          personal_info: {
            full_name: formData.full_name,
            career_objectives: formData.career_objectives,
            birthdate: formData.birthdate,
            address: formData.address,
            contact_number: formData.contact_number,
            email: formData.email
          },
          education: {
            college_degree: formData.college_degree,
            year_graduated: formData.year_graduated,
            school_attended: formData.school_attended
          },
          work_experiences: formData.work_experiences,
          documents: {
            otr_url: formData.otr_url,
            diploma_url: formData.diploma_url,
            id_url: formData.id_url,
            resume_url: formData.resume_url
          },
          additional_notes: formData.additional_notes
        },
        
        applied_via: 'application_form'
      }

      // Submit application
      const { data, error } = await supabase
        .from(TABLES.APPLICATIONS || 'applications')
        .insert([applicationData])
        .select()
        .single()

      if (error) throw error

      // Create initial conversation with employer
      try {
        const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2)}`
        
        await supabase
          .from(TABLES.MESSAGES || 'messages')
          .insert([{
            conversation_id: conversationId,
            sender_id: profile.id,
            recipient_id: job.employer_id,
            job_id: jobId,
            application_id: data.id,
            content: `Hi! I have submitted my application for the ${job.title} position. ${formData.cover_letter ? 'Please see my cover letter and attached documents for more details.' : 'I am very interested in this opportunity and look forward to hearing from you.'}`,
            type: 'text'
          }])
      } catch (messageError) {
        console.warn('Could not create initial message:', messageError)
      }

      toast.success('Application submitted successfully!')
      navigate('/jobs', { 
        state: { message: 'Your application has been submitted successfully!' }
      })

    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error(`Failed to submit application: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (existingApplication) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Application Already Submitted
          </h3>
          <p className="text-yellow-700 mb-4">
            You have already applied to this job on {formatDate(existingApplication.created_at)}.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/jobs')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Browse Other Jobs
            </button>
            <button
              onClick={() => navigate('/applications')}
              className="px-4 py-2 border border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50"
            >
              View My Applications
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Apply for {job?.title} - JobFinder</title>
      </Helmet>

      {/* Job Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-start space-x-4">
          {job?.employer_profiles?.company_logo_url ? (
            <img
              src={job.employer_profiles.company_logo_url}
              alt={job.employer_profiles.company_name}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            </div>
          )}
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{job?.title}</h1>
            <p className="text-lg text-gray-600 mb-2">{job?.employer_profiles?.company_name}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                {job?.location || 'Remote'}
              </span>
              <span className="flex items-center">
                <BriefcaseIcon className="h-4 w-4 mr-1" />
                {job?.employment_type?.replace('-', ' ')}
              </span>
              {job?.salary_min && (
                <span className="flex items-center">
                  <span className="mr-1">💰</span>
                  {formatSalary(job.salary_min, job.salary_max)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.full_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="your.email@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number *
              </label>
              <input
                type="tel"
                value={formData.contact_number}
                onChange={(e) => handleInputChange('contact_number', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contact_number ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.contact_number && <p className="mt-1 text-sm text-red-600">{errors.contact_number}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birthdate *
              </label>
              <input
                type="date"
                value={formData.birthdate}
                onChange={(e) => handleInputChange('birthdate', e.target.value)}
                max={new Date(Date.now() - 16 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.birthdate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.birthdate && <p className="mt-1 text-sm text-red-600">{errors.birthdate}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your complete address"
              />
              {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Career Objectives *
              </label>
              <textarea
                value={formData.career_objectives}
                onChange={(e) => handleInputChange('career_objectives', e.target.value)}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.career_objectives ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe your career goals and what you hope to achieve in this role..."
              />
              {errors.career_objectives && <p className="mt-1 text-sm text-red-600">{errors.career_objectives}</p>}
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <AcademicCapIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Education</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                College Degree *
              </label>
              <input
                type="text"
                value={formData.college_degree}
                onChange={(e) => handleInputChange('college_degree', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.college_degree ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Bachelor of Science in Computer Science"
              />
              {errors.college_degree && <p className="mt-1 text-sm text-red-600">{errors.college_degree}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year Graduated *
              </label>
              <input
                type="number"
                min="1950"
                max={new Date().getFullYear()}
                value={formData.year_graduated}
                onChange={(e) => handleInputChange('year_graduated', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.year_graduated ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="2020"
              />
              {errors.year_graduated && <p className="mt-1 text-sm text-red-600">{errors.year_graduated}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Attended *
              </label>
              <input
                type="text"
                value={formData.school_attended}
                onChange={(e) => handleInputChange('school_attended', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.school_attended ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., University of California, Berkeley"
              />
              {errors.school_attended && <p className="mt-1 text-sm text-red-600">{errors.school_attended}</p>}
            </div>
          </div>
        </div>

        {/* Work Experience */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BriefcaseIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
            </div>
            <button
              type="button"
              onClick={addWorkExperience}
              className="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              Add Experience
            </button>
          </div>

          {errors.work_experience && (
            <p className="mb-4 text-sm text-red-600">{errors.work_experience}</p>
          )}

          <div className="space-y-6">
            {formData.work_experiences.map((experience, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Work Experience {index + 1}
                  </h3>
                  {formData.work_experiences.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWorkExperience(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      value={experience.position}
                      onChange={(e) => handleWorkExperienceChange(index, 'position', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Software Developer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Previous Employer
                    </label>
                    <input
                      type="text"
                      value={experience.previous_employer}
                      onChange={(e) => handleWorkExperienceChange(index, 'previous_employer', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., ABC Company Inc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={experience.duration}
                      onChange={(e) => handleWorkExperienceChange(index, 'duration', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., January 2020 - December 2022"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Actual Duties and Responsibilities
                    </label>
                    <textarea
                      value={experience.duties_responsibilities}
                      onChange={(e) => handleWorkExperienceChange(index, 'duties_responsibilities', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your key responsibilities and achievements in this role..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Uploads */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Required Documents</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resume * {errors.resume && <span className="text-red-600">(Required)</span>}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e.target.files[0], 'resume')}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  {uploadProgress.resume.uploading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Uploading...</span>
                    </div>
                  ) : uploadProgress.resume.uploaded ? (
                    <div className="flex items-center justify-center text-green-600">
                      <CheckIcon className="h-6 w-6 mr-2" />
                      <span className="text-sm">Resume uploaded</span>
                    </div>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Upload Resume</p>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX (Max 10MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Valid ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid ID * {errors.id && <span className="text-red-600">(Required)</span>}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e.target.files[0], 'id')}
                  className="hidden"
                  id="id-upload"
                />
                <label htmlFor="id-upload" className="cursor-pointer">
                  {uploadProgress.id.uploading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Uploading...</span>
                    </div>
                  ) : uploadProgress.id.uploaded ? (
                    <div className="flex items-center justify-center text-green-600">
                      <CheckIcon className="h-6 w-6 mr-2" />
                      <span className="text-sm">ID uploaded</span>
                    </div>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Upload Valid ID</p>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* OTR */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Official Transcript of Records (OTR)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e.target.files[0], 'otr')}
                  className="hidden"
                  id="otr-upload"
                />
                <label htmlFor="otr-upload" className="cursor-pointer">
                  {uploadProgress.otr.uploading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Uploading...</span>
                    </div>
                  ) : uploadProgress.otr.uploaded ? (
                    <div className="flex items-center justify-center text-green-600">
                      <CheckIcon className="h-6 w-6 mr-2" />
                      <span className="text-sm">OTR uploaded</span>
                    </div>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Upload OTR</p>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Diploma */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diploma
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e.target.files[0], 'diploma')}
                  className="hidden"
                  id="diploma-upload"
                />
                <label htmlFor="diploma-upload" className="cursor-pointer">
                  {uploadProgress.diploma.uploading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Uploading...</span>
                    </div>
                  ) : uploadProgress.diploma.uploaded ? (
                    <div className="flex items-center justify-center text-green-600">
                      <CheckIcon className="h-6 w-6 mr-2" />
                      <span className="text-sm">Diploma uploaded</span>
                    </div>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Upload Diploma</p>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Cover Letter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Cover Letter</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why are you interested in this position?
              </label>
              <textarea
                value={formData.cover_letter}
                onChange={(e) => handleInputChange('cover_letter', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us why you're the perfect fit for this role and what excites you about this opportunity..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.additional_notes}
                onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional information you'd like to share..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting Application...
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}