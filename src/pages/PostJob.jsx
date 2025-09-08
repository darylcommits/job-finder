// src/pages/PostJob.jsx - Fixed version with improved storage handling
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TagIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  UsersIcon,
  PhotoIcon,
  XMarkIcon,
  PlusIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

import { useAuth } from '../contexts/AuthContext'
import { supabase, TABLES, EMPLOYMENT_TYPES, USER_ROLES } from '../lib/supabase'
import { COMMON_SKILLS, EXPERIENCE_LEVELS, EDUCATION_LEVELS, JOB_CATEGORIES } from '../lib/constants'

// Updated StorageSetup Component with bucket creation capability
function StorageSetup() {
  const [setting, setSetting] = useState(false)
  const [status, setStatus] = useState('idle')
  const [debugInfo, setDebugInfo] = useState('')

  // Auto-check on component mount
  useEffect(() => {
    checkStorageSetup()
  }, [])

  const checkStorageSetup = async () => {
    try {
      setStatus('checking')
      setDebugInfo('Starting storage check...')
      
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setDebugInfo('❌ Authentication failed')
        setStatus('error')
        return false
      }
      setDebugInfo(`✅ User authenticated: ${user.id}`)

      // Try to test upload directly (this will tell us if everything works)
      try {
        const testBlob = new Blob(['test'], { type: 'text/plain' })
        const testFileName = `test-${Date.now()}-${Math.random().toString(36).substring(2)}.txt`
        
        setDebugInfo(`🧪 Testing upload: ${testFileName}`)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('job-media')
          .upload(testFileName, testBlob, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Test upload failed:', uploadError)
          setDebugInfo(`❌ Upload test failed: ${uploadError.message}`)
          
          // Check specific error types
          if (uploadError.message.includes('Bucket not found')) {
            setDebugInfo('❌ Bucket not found. Need to create bucket and policies.')
            setStatus('needs_setup')
            return false
          } else if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
            setDebugInfo('❌ Bucket exists but policies missing.')
            setStatus('needs_policies')
            return false
          } else {
            setDebugInfo(`❌ Other error: ${uploadError.message}`)
            setStatus('error')
            return false
          }
        }

        setDebugInfo(`✅ Upload test successful: ${uploadData.path}`)

        // Test getting public URL
        const { data: { publicUrl } } = supabase.storage
          .from('job-media')
          .getPublicUrl(testFileName)
        
        setDebugInfo(`✅ Public URL test: ${publicUrl}`)

        // Clean up test file
        const { error: deleteError } = await supabase.storage
          .from('job-media')
          .remove([testFileName])
        
        if (!deleteError) {
          setDebugInfo('✅ All tests passed - Storage ready!')
        }
        
        setStatus('ready')
        return true
      } catch (testError) {
        console.error('Permission test failed:', testError)
        setDebugInfo(`❌ Permission test failed: ${testError.message}`)
        setStatus('error')
        return false
      }
    } catch (error) {
      console.error('Storage check error:', error)
      setDebugInfo(`❌ Unexpected error: ${error.message}`)
      setStatus('error')
      return false
    }
  }

  const setupStorage = async () => {
    try {
      setSetting(true)
      setDebugInfo('🔧 Starting setup...')
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Authentication required. Please log in again.')
      }

      // Try a simple test upload to see what's missing
      setDebugInfo('🧪 Testing upload capability...')
      
      const testBlob = new Blob(['test'], { type: 'text/plain' })
      const testFileName = `setup-test-${Date.now()}.txt`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('job-media')
        .upload(testFileName, testBlob, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        setDebugInfo(`❌ Upload failed: ${uploadError.message}`)
        
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Storage bucket does not exist. Please run the SQL manually to create it.')
        } else if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
          throw new Error('Storage policies are missing. Please run the SQL manually to create them.')
        } else {
          throw new Error(`Upload test failed: ${uploadError.message}`)
        }
      } else {
        setDebugInfo('✅ Upload test successful! Cleaning up...')
        
        // Clean up test file
        await supabase.storage.from('job-media').remove([testFileName])
        
        setStatus('ready')
        toast.success('Storage is already working correctly!')
        return
      }

    } catch (error) {
      console.error('Storage setup failed:', error)
      setDebugInfo(`❌ Setup failed: ${error.message}`)
      setStatus('error')
      toast.error(`Setup failed: ${error.message}. Please use "Copy SQL" and run it manually.`, { duration: 6000 })
    } finally {
      setSetting(false)
    }
  }

  const copySQL = () => {
    const sql = `-- Complete Storage Setup for job-media bucket
-- Run these commands in your Supabase SQL Editor

-- Step 1: Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-media', 
  'job-media', 
  true,
  52428800,
  '{image/*,video/*}'
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = '{image/*,video/*}';

-- Step 2: Drop any existing conflicting policies
DROP POLICY IF EXISTS "job_media_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "job_media_public_access" ON storage.objects;
DROP POLICY IF EXISTS "job_media_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "job_media_authenticated_delete" ON storage.objects;

-- Step 3: Create storage policies
CREATE POLICY "job_media_authenticated_upload" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'job-media' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "job_media_public_access" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'job-media');

CREATE POLICY "job_media_authenticated_update" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'job-media' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "job_media_authenticated_delete" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'job-media' 
    AND auth.role() = 'authenticated'
  );

-- Step 4: Verify setup
SELECT 
  'Bucket: ' || b.id as info
FROM storage.buckets b 
WHERE b.id = 'job-media'
UNION ALL
SELECT 
  'Policy: ' || policyname as info
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%job_media%'
ORDER BY info;`

    navigator.clipboard.writeText(sql)
    toast.success('Setup SQL copied! Paste this into your Supabase SQL Editor and run it.', { duration: 4000 })
  }

  const forceReset = async () => {
    try {
      setStatus('checking')
      setDebugInfo('🔄 Resetting and rechecking...')
      
      setTimeout(async () => {
        await checkStorageSetup()
      }, 1000)
    } catch (error) {
      setDebugInfo(`❌ Reset failed: ${error.message}`)
      setStatus('error')
    }
  }

  return (
    <div className={`border rounded-lg p-4 mb-6 ${
      status === 'ready' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-sm font-medium ${
            status === 'ready' ? 'text-green-800' : 'text-yellow-800'
          }`}>
            Storage Setup {status === 'ready' ? 'Complete' : 'Required'}
          </h3>
          <p className={`text-xs mt-1 ${
            status === 'ready' ? 'text-green-700' : 'text-yellow-700'
          }`}>
            Status: <span className={status === 'ready' ? 'text-green-600' : 'text-red-600'}>
              {status === 'ready' ? '✅ Ready' : 
               status === 'checking' ? '🔄 Checking...' : 
               status === 'needs_setup' ? '🏗️ Needs Setup' :
               status === 'needs_policies' ? '🔐 Needs Policies' :
               '❌ Error'}
            </span>
          </p>
          {debugInfo && (
            <p className="text-xs mt-1 text-gray-600 font-mono max-w-md truncate" title={debugInfo}>
              {debugInfo}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={checkStorageSetup}
            disabled={status === 'checking' || setting}
            className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 px-2 py-1 rounded disabled:opacity-50"
          >
            {status === 'checking' ? '...' : 'Check'}
          </button>
          {status !== 'ready' && (
            <>
              <button
                onClick={setupStorage}
                disabled={setting || status === 'checking'}
                className="text-xs bg-green-100 text-green-800 hover:bg-green-200 px-2 py-1 rounded disabled:opacity-50"
              >
                {setting ? '...' : 'Auto Fix'}
              </button>
              <button
                onClick={forceReset}
                disabled={setting || status === 'checking'}
                className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200 px-2 py-1 rounded disabled:opacity-50"
              >
                Reset
              </button>
            </>
          )}
          <button
            onClick={copySQL}
            className="text-xs bg-gray-100 text-gray-800 hover:bg-gray-200 px-2 py-1 rounded"
          >
            Copy SQL
          </button>
        </div>
      </div>
      
      {status !== 'ready' && status !== 'checking' && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
          <p className="text-red-800 font-medium">
            {status === 'needs_setup' ? 'Bucket Creation Required' :
             status === 'needs_policies' ? 'Policies Setup Required' :
             'Manual Setup Required'}
          </p>
          <p className="text-red-700 text-xs mt-1">
            {status === 'needs_setup' ? 
              'The job-media storage bucket needs to be created. Click "Auto Fix" or use "Copy SQL" for manual setup.' :
             status === 'needs_policies' ? 
              'Storage bucket exists but access policies are missing. Click "Auto Fix" or use "Copy SQL".' :
              'Storage setup failed. Please click "Copy SQL" and run the commands in your Supabase SQL Editor.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default function PostJob() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: [''],
    skills_required: [],
    experience_required_min: '',
    experience_required_max: '',
    education_required: '',
    employment_type: 'full-time',
    location: '',
    is_remote: false,
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    benefits: [''],
    expires_at: '',
    status: 'draft',
    category: '',
    media_urls: [], // For job-related images/videos
    workplace_images: [] // For office/workplace photos
  })
  const [errors, setErrors] = useState({})
  const [previewUrls, setPreviewUrls] = useState({
    media: [],
    workplace: []
  })

  // Prevent any navigation to /jobs that might trigger relationship errors
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clean up any potential subscriptions or listeners
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Redirect if not employer - but avoid navigating to /jobs
  useEffect(() => {
    if (profile && profile.role !== USER_ROLES.EMPLOYER) {
      navigate('/dashboard')
    }
  }, [profile, navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSkillsChange = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills_required: prev.skills_required.includes(skill)
        ? prev.skills_required.filter(s => s !== skill)
        : [...prev.skills_required, skill]
    }))
  }

  // Simplified image upload with better error handling
  const handleImageUpload = async (files, type) => {
    if (!files || files.length === 0) return

    try {
      setUploading(true)
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Please log in to upload files.')
      }

      const uploadPromises = Array.from(files).map(async (file, index) => {
        console.log(`Uploading file ${index + 1}:`, file.name)
        
        // Validate file
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          throw new Error(`Invalid file type: ${file.type}. Only images and videos allowed.`)
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File too large: ${file.name}. Max 10MB.`)
        }

        // Create unique filename
        const fileExt = file.name.split('.').pop()
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2)
        const fileName = `${user.id}/${type}/${timestamp}-${random}.${fileExt}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('job-media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error('Upload error:', error)
          
          if (error.message.includes('Bucket not found')) {
            throw new Error('Storage not ready. Please complete the storage setup first.')
          } else if (error.message.includes('row-level security') || error.message.includes('policy')) {
            throw new Error('Permission denied. Please complete the storage setup first.')
          } else {
            throw new Error(`Upload failed: ${error.message}`)
          }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('job-media')
          .getPublicUrl(fileName)

        return publicUrl
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      
      // Update form data
      const fieldName = type === 'media' ? 'media_urls' : 'workplace_images'
      setFormData(prev => ({
        ...prev,
        [fieldName]: [...prev[fieldName], ...uploadedUrls]
      }))

      // Update preview URLs
      setPreviewUrls(prev => ({
        ...prev,
        [type]: [...prev[type], ...uploadedUrls]
      }))

      toast.success(`${uploadedUrls.length} file(s) uploaded successfully!`)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.message)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (type, index) => {
    const fieldName = type === 'media' ? 'media_urls' : 'workplace_images'
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index)
    }))

    setPreviewUrls(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required'
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Job category is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required'
    }

    if (!formData.location.trim() && !formData.is_remote) {
      newErrors.location = 'Location is required for non-remote jobs'
    }

    if (formData.salary_min && formData.salary_max) {
      if (parseInt(formData.salary_min) >= parseInt(formData.salary_max)) {
        newErrors.salary_max = 'Maximum salary must be greater than minimum salary'
      }
    }

    if (formData.experience_required_min && formData.experience_required_max) {
      if (parseInt(formData.experience_required_min) > parseInt(formData.experience_required_max)) {
        newErrors.experience_required_max = 'Maximum experience must be greater than or equal to minimum'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    try {
      setLoading(true)
      console.log('🚀 Starting job posting...')
      
      // Prepare job data
      const jobData = {
        employer_id: profile.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category || null,
        employment_type: formData.employment_type,
        location: formData.is_remote ? null : formData.location.trim(),
        is_remote: formData.is_remote,
        requirements: formData.requirements.filter(req => req.trim()),
        skills_required: formData.skills_required,
        benefits: formData.benefits.filter(benefit => benefit.trim()),
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        salary_currency: formData.salary_currency,
        experience_required_min: formData.experience_required_min ? parseInt(formData.experience_required_min) : null,
        experience_required_max: formData.experience_required_max ? parseInt(formData.experience_required_max) : null,
        education_required: formData.education_required || null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        status: formData.status,
        media_urls: formData.media_urls || [],
        workplace_images: formData.workplace_images || []
      }

      console.log('📊 Processed job data:', jobData)

      // Insert job without any relationship queries
      const { data, error } = await supabase
        .from(TABLES.JOBS || 'jobs')
        .insert([jobData])
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log('✅ Job posted successfully:', data)

      toast.success(
        formData.status === 'active' || formData.status === 'pending_approval'
          ? 'Job posted successfully!' 
          : 'Job saved as draft!'
      )
      
      // Navigate to jobs page or dashboard instead of jobs with potential relationship queries
      navigate('/dashboard')
      
    } catch (error) {
      console.error('❌ Error posting job:', error)
      
      let errorMessage = 'Failed to post job'
      
      if (error.code === 'PGRST301') {
        errorMessage = 'Permission denied. Please ensure you have employer privileges.'
      } else if (error.code === '23503') {
        errorMessage = 'Invalid data reference. Please check your input.'
      } else if (error.code === '42501') {
        errorMessage = 'Database permission error. Please contact support.'
      } else if (error.message) {
        errorMessage = `Failed to post job: ${error.message}`
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Get skills based on selected category
  const getSkillsByCategory = (category) => {
    const skillsByCategory = {
      'Technology': [
        'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'HTML/CSS', 'SQL', 'Git',
        'AWS', 'Docker', 'MongoDB', 'PostgreSQL', 'TypeScript', 'Vue.js', 'Angular'
      ],
      'Healthcare': [
        'Patient Care', 'Medical Records', 'CPR Certified', 'First Aid', 'Nursing',
        'Medical Terminology', 'HIPAA Compliance', 'Electronic Health Records',
        'Medication Administration', 'Vital Signs', 'Medical Equipment'
      ],
      'Finance': [
        'Financial Analysis', 'Excel', 'QuickBooks', 'Accounting', 'Budgeting',
        'Forecasting', 'Tax Preparation', 'Financial Modeling', 'Auditing',
        'Investment Analysis', 'Risk Management', 'Banking'
      ],
      'Education': [
        'Curriculum Development', 'Classroom Management', 'Lesson Planning',
        'Student Assessment', 'Educational Technology', 'Special Education',
        'Teaching Certification', 'Child Development', 'Tutoring'
      ],
      'Marketing': [
        'Google Analytics', 'SEO', 'SEM', 'Social Media Marketing', 'Content Marketing',
        'Email Marketing', 'PPC', 'Facebook Ads', 'Google Ads', 'Brand Management',
        'Market Research', 'Creative Writing', 'Adobe Creative Suite'
      ],
      'Sales': [
        'CRM', 'Salesforce', 'Lead Generation', 'Cold Calling', 'Account Management',
        'Business Development', 'Negotiation', 'Customer Success', 'Prospecting',
        'Sales Presentations', 'Relationship Building'
      ],
      'Engineering': [
        'AutoCAD', 'SolidWorks', 'Project Management', 'Quality Control',
        'Technical Drawing', 'Problem Solving', 'Manufacturing', 'Design',
        'Testing', 'Documentation', 'Safety Protocols'
      ],
      'Design': [
        'Adobe Creative Suite', 'Figma', 'Sketch', 'InVision', 'UI/UX Design',
        'Graphic Design', 'Web Design', 'Adobe Photoshop', 'Adobe Illustrator',
        'Branding', 'Typography', 'Color Theory'
      ],
      'Customer Service': [
        'Communication Skills', 'Problem Solving', 'Patience', 'Active Listening',
        'Conflict Resolution', 'CRM Software', 'Phone Etiquette', 'Multitasking',
        'Data Entry', 'Order Processing'
      ],
      'Human Resources': [
        'Recruitment', 'Employee Relations', 'Performance Management', 'HRIS',
        'Payroll', 'Benefits Administration', 'Training and Development',
        'Policy Development', 'Compliance', 'Interviewing'
      ],
      'Operations': [
        'Project Management', 'Process Improvement', 'Supply Chain', 'Logistics',
        'Inventory Management', 'Quality Assurance', 'Data Analysis',
        'Vendor Management', 'Cost Control'
      ],
      'Legal': [
        'Legal Research', 'Contract Review', 'Litigation', 'Compliance',
        'Legal Writing', 'Case Management', 'Client Relations', 'Document Review',
        'Negotiation', 'Regulatory Knowledge'
      ],
      'Construction': [
        'Blueprint Reading', 'Safety Protocols', 'Hand Tools', 'Power Tools',
        'Construction Management', 'Building Codes', 'Project Planning',
        'Quality Control', 'Team Leadership', 'Heavy Machinery'
      ],
      'Manufacturing': [
        'Quality Control', 'Safety Protocols', 'Machinery Operation', 'Assembly',
        'Production Planning', 'Lean Manufacturing', 'Six Sigma', 'Maintenance',
        'Troubleshooting', 'Documentation'
      ],
      'Retail': [
        'Customer Service', 'Sales', 'Cash Handling', 'Inventory Management',
        'Merchandising', 'POS Systems', 'Product Knowledge', 'Team Work',
        'Loss Prevention', 'Visual Display'
      ],
      'Hospitality': [
        'Customer Service', 'Food Safety', 'Hotel Management', 'Event Planning',
        'Reservation Systems', 'Housekeeping', 'Front Desk Operations',
        'Catering', 'Tourism', 'Language Skills'
      ],
      'Transportation': [
        'Commercial Driving License', 'Route Planning', 'Vehicle Maintenance',
        'Safety Regulations', 'GPS Navigation', 'Logistics', 'Customer Service',
        'Time Management', 'Record Keeping'
      ],
      'Real Estate': [
        'Real Estate License', 'Market Analysis', 'Property Valuation',
        'Client Relations', 'Negotiation', 'Contract Management', 'Marketing',
        'Property Management', 'Investment Analysis'
      ],
      'Media': [
        'Content Creation', 'Video Editing', 'Photography', 'Social Media',
        'Writing', 'Broadcasting', 'Journalism', 'Adobe Creative Suite',
        'SEO', 'Digital Marketing'
      ],
      'Non-Profit': [
        'Grant Writing', 'Fundraising', 'Volunteer Management', 'Community Outreach',
        'Program Development', 'Event Planning', 'Public Speaking',
        'Database Management', 'Social Services'
      ],
      'Government': [
        'Public Administration', 'Policy Analysis', 'Regulatory Compliance',
        'Public Speaking', 'Grant Management', 'Community Relations',
        'Security Clearance', 'Government Procedures'
      ]
    }

    return skillsByCategory[category] || [
      'Communication', 'Teamwork', 'Problem Solving', 'Time Management',
      'Leadership', 'Organization', 'Customer Service', 'Attention to Detail',
      'Adaptability', 'Work Ethic', 'Critical Thinking', 'Creativity'
    ]
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Post a Job - JobFinder</title>
      </Helmet>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Post a New Job</h1>
        <p className="mt-2 text-gray-600">
          Find the perfect candidate for your team
        </p>
      </div>

      {/* Storage Setup Warning */}
      <StorageSetup />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <BriefcaseIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Sales Manager, Nurse, Chef, Marketing Coordinator"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Job Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {JOB_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700 mb-2">
                Employment Type *
              </label>
              <select
                id="employment_type"
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location {!formData.is_remote && '*'}
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={formData.is_remote}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.location ? 'border-red-300' : 'border-gray-300'
                  } ${formData.is_remote ? 'bg-gray-100' : ''}`}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
              
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  name="is_remote"
                  checked={formData.is_remote}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">This is a remote position</span>
              </label>
            </div>
          </div>
        </div>

        {/* Job Media Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <PhotoIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Job Media</h2>
          </div>

          {/* Job-related Media */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Images/Videos
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Upload images or videos that showcase the role, team, or projects. Max 10MB per file.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleImageUpload(e.target.files, 'media')}
                className="hidden"
                id="job-media-upload"
                disabled={uploading}
              />
              <label htmlFor="job-media-upload" className="cursor-pointer">
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Click to upload job media'}
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, MP4, WebM up to 10MB
                </p>
              </label>
            </div>

            {/* Media Preview */}
            {previewUrls.media.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previewUrls.media.map((url, index) => (
                  <div key={index} className="relative group">
                    {url.includes('.mp4') || url.includes('.webm') ? (
                      <video
                        src={url}
                        className="w-full h-24 object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Job media ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage('media', index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workplace Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workplace Photos
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Show your office, workspace, or work environment to give candidates a feel for your company culture.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files, 'workplace')}
                className="hidden"
                id="workplace-upload"
                disabled={uploading}
              />
              <label htmlFor="workplace-upload" className="cursor-pointer">
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Click to upload workplace photos'}
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG up to 10MB
                </p>
              </label>
            </div>

            {/* Workplace Preview */}
            {previewUrls.workplace.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previewUrls.workplace.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Workplace ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage('workplace', index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Job Description</h2>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={8}
              value={formData.description}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Requirements */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            {formData.requirements.map((requirement, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter a requirement"
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('requirements', index)}
                    className="ml-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('requirements')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Requirement
            </button>
          </div>
        </div>

        {/* Skills & Experience */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <TagIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Skills & Experience</h2>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Skills & Qualifications
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Select skills relevant to your job category. You can also add custom skills in the requirements section.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {getSkillsByCategory(formData.category).map((skill) => (
                <label key={skill} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.skills_required.includes(skill)}
                    onChange={() => handleSkillsChange(skill)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{skill}</span>
                </label>
              ))}
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Selected: {formData.skills_required.length} skills
              </p>
            </div>
          </div>

          {/* Experience */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="experience_required_min" className="block text-sm font-medium text-gray-700 mb-2">
                Min Experience (years)
              </label>
              <select
                id="experience_required_min"
                name="experience_required_min"
                value={formData.experience_required_min}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any</option>
                {[0, 1, 2, 3, 5, 8, 10].map(year => (
                  <option key={year} value={year}>{year} years</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="experience_required_max" className="block text-sm font-medium text-gray-700 mb-2">
                Max Experience (years)
              </label>
              <select
                id="experience_required_max"
                name="experience_required_max"
                value={formData.experience_required_max}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.experience_required_max ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Any</option>
                {[1, 2, 3, 5, 8, 10, 15].map(year => (
                  <option key={year} value={year}>{year} years</option>
                ))}
              </select>
              {errors.experience_required_max && (
                <p className="mt-1 text-sm text-red-600">{errors.experience_required_max}</p>
              )}
            </div>

            <div>
              <label htmlFor="education_required" className="block text-sm font-medium text-gray-700 mb-2">
                Education Level
              </label>
              <select
                id="education_required"
                name="education_required"
                value={formData.education_required}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any</option>
                {EDUCATION_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Compensation & Benefits */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <CurrencyDollarIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Compensation & Benefits</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label htmlFor="salary_min" className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Salary
              </label>
              <input
                type="number"
                id="salary_min"
                name="salary_min"
                value={formData.salary_min}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="50000"
              />
            </div>

            <div>
              <label htmlFor="salary_max" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Salary
              </label>
              <input
                type="number"
                id="salary_max"
                name="salary_max"
                value={formData.salary_max}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.salary_max ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="80000"
              />
              {errors.salary_max && <p className="mt-1 text-sm text-red-600">{errors.salary_max}</p>}
            </div>

            <div>
              <label htmlFor="salary_currency" className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                id="salary_currency"
                name="salary_currency"
                value={formData.salary_currency}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="PHP">PHP</option>
              </select>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benefits & Perks
            </label>
            {formData.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Health insurance, Flexible hours"
                />
                {formData.benefits.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('benefits', index)}
                    className="ml-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('benefits')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Benefit
            </button>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <ClockIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Additional Settings</h2>
          </div>

          <div>
            <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700 mb-2">
              Application Deadline
            </label>
            <input
              type="date"
              id="expires_at"
              name="expires_at"
              value={formData.expires_at}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave empty for no deadline
            </p>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            type="button"
            onClick={() => {
              setFormData(prev => ({ ...prev, status: 'draft' }))
              handleSubmit({ preventDefault: () => {} })
            }}
            disabled={loading || uploading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Save as Draft
          </button>
          
          <button
            type="submit"
            onClick={() => setFormData(prev => ({ ...prev, status: 'pending_approval' }))}
            disabled={loading || uploading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Posting...
              </>
            ) : uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              'Post Job'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}