// src/pages/Profile.jsx
import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { 
  PencilIcon,
  CameraIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  LinkIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

import { useAuth } from '../contexts/AuthContext'
import { supabase, TABLES, USER_ROLES } from '../lib/supabase'
import { getInitials, getAvatarColor, validateFileType, validateFileSize } from '../lib/utils'

export default function Profile() {
  const { profile, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({})
  const [avatarFile, setAvatarFile] = useState(null)
  const [skills, setSkills] = useState('')

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        headline: profile.headline || '',
        ...getProfileSpecificData()
      })
      
      if (profile.role === USER_ROLES.JOB_SEEKER && profile.job_seeker_profiles?.[0]?.skills) {
        setSkills(profile.job_seeker_profiles[0].skills.join(', '))
      }
    }
  }, [profile])

  const getProfileSpecificData = () => {
    if (!profile) return {}
    
    switch (profile.role) {
      case USER_ROLES.JOB_SEEKER:
        const jobSeekerProfile = profile.job_seeker_profiles?.[0] || {}
        return {
          experience_years: jobSeekerProfile.experience_years || '',
          education_level: jobSeekerProfile.education_level || '',
          expected_salary_min: jobSeekerProfile.expected_salary_min || '',
          expected_salary_max: jobSeekerProfile.expected_salary_max || '',
          resume_url: jobSeekerProfile.resume_url || '',
          portfolio_url: jobSeekerProfile.portfolio_url || '',
          linkedin_url: jobSeekerProfile.linkedin_url || '',
          github_url: jobSeekerProfile.github_url || ''
        }
      
      case USER_ROLES.EMPLOYER:
        const employerProfile = profile.employer_profiles?.[0] || {}
        return {
          company_name: employerProfile.company_name || '',
          company_website: employerProfile.company_website || '',
          company_size: employerProfile.company_size || '',
          industry: employerProfile.industry || '',
          company_description: employerProfile.company_description || '',
          founded_year: employerProfile.founded_year || ''
        }
      
      case USER_ROLES.INSTITUTION_PARTNER:
        const institutionProfile = profile.institution_partners?.[0] || {}
        return {
          institution_name: institutionProfile.institution_name || '',
          institution_type: institutionProfile.institution_type || '',
          institution_website: institutionProfile.institution_website || '',
          contact_person: institutionProfile.contact_person || '',
          contact_email: institutionProfile.contact_email || ''
        }
      
      default:
        return {}
    }
  }

  // Avatar upload handling
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])) {
      toast.error('Please upload a valid image file (JPEG, PNG, or WebP)')
      return
    }

    if (!validateFileSize(file, 5)) {
      toast.error('File size must be less than 5MB')
      return
    }

    setAvatarFile(file)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  })

  const uploadAvatar = async () => {
    if (!avatarFile) return null

    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${profile.id}/avatar.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
      return null
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSkillsChange = (e) => {
    setSkills(e.target.value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Upload avatar if provided
      let avatarUrl = profile.avatar_url
      if (avatarFile) {
        avatarUrl = await uploadAvatar()
      }

      // Update main profile
      const profileUpdates = {
        full_name: formData.full_name,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        headline: formData.headline,
        ...(avatarUrl && { avatar_url: avatarUrl })
      }

      const { error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .update(profileUpdates)
        .eq('id', profile.id)

      if (profileError) throw profileError

      // Update role-specific profile
      await updateRoleSpecificProfile()

      // Refresh profile data
      await updateProfile(profileUpdates)
      
      setIsEditing(false)
      setAvatarFile(null)
      toast.success('Profile updated successfully!')
      
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const updateRoleSpecificProfile = async () => {
    switch (profile.role) {
      case USER_ROLES.JOB_SEEKER:
        const skillsArray = skills.split(',').map(skill => skill.trim()).filter(skill => skill)
        
        const jobSeekerUpdates = {
          skills: skillsArray,
          experience_years: parseInt(formData.experience_years) || 0,
          education_level: formData.education_level,
          expected_salary_min: parseInt(formData.expected_salary_min) || null,
          expected_salary_max: parseInt(formData.expected_salary_max) || null,
          resume_url: formData.resume_url,
          portfolio_url: formData.portfolio_url,
          linkedin_url: formData.linkedin_url,
          github_url: formData.github_url
        }

        const { error: jobSeekerError } = await supabase
          .from(TABLES.JOB_SEEKER_PROFILES)
          .update(jobSeekerUpdates)
          .eq('user_id', profile.id)

        if (jobSeekerError) throw jobSeekerError
        break

      case USER_ROLES.EMPLOYER:
        const employerUpdates = {
          company_name: formData.company_name,
          company_website: formData.company_website,
          company_size: formData.company_size,
          industry: formData.industry,
          company_description: formData.company_description,
          founded_year: parseInt(formData.founded_year) || null
        }

        const { error: employerError } = await supabase
          .from(TABLES.EMPLOYER_PROFILES)
          .update(employerUpdates)
          .eq('user_id', profile.id)

        if (employerError) throw employerError
        break

      case USER_ROLES.INSTITUTION_PARTNER:
        const institutionUpdates = {
          institution_name: formData.institution_name,
          institution_type: formData.institution_type,
          institution_website: formData.institution_website,
          contact_person: formData.contact_person,
          contact_email: formData.contact_email
        }

        const { error: institutionError } = await supabase
          .from(TABLES.INSTITUTION_PARTNERS)
          .update(institutionUpdates)
          .eq('user_id', profile.id)

        if (institutionError) throw institutionError
        break
    }
  }

  if (!profile) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Profile - JobFinder</title>
      </Helmet>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              {/* Avatar */}
              <div className="relative">
                {isEditing ? (
                  <div
                    {...getRootProps()}
                    className={`w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors ${
                      isDragActive ? 'border-blue-400 bg-blue-50' : ''
                    }`}
                  >
                    <input {...getInputProps()} />
                    {avatarFile ? (
                      <img
                        src={URL.createObjectURL(avatarFile)}
                        alt="New avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full rounded-full flex items-center justify-center text-white text-xl font-semibold ${getAvatarColor(profile.full_name || profile.email)}`}>
                        {getInitials(profile.full_name || profile.email)}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <CameraIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <>
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-xl font-semibold ${getAvatarColor(profile.full_name || profile.email)}`}>
                        {getInitials(profile.full_name || profile.email)}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile.full_name || 'Complete your profile'}
                </h1>
                {profile.headline && (
                  <p className="text-lg text-gray-600 mb-4">{profile.headline}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {profile.location && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {profile.location}
                    </div>
                  )}
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    {profile.email}
                  </div>
                  {profile.phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      {profile.phone}
                    </div>
                  )}
                </div>
                {profile.bio && (
                  <p className="mt-4 text-gray-600">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Profile Completion */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Profile Completion</span>
              <span className="text-sm text-gray-500">{profile.profile_completion || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${profile.profile_completion || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Profile</h2>
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Headline
              </label>
              <input
                type="text"
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                placeholder="e.g., Senior Software Engineer at TechCorp"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              rows={4}
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Role-specific fields */}
          {profile.role === USER_ROLES.JOB_SEEKER && (
            <JobSeekerFields 
              formData={formData}
              handleChange={handleChange}
              skills={skills}
              handleSkillsChange={handleSkillsChange}
            />
          )}

          {profile.role === USER_ROLES.EMPLOYER && (
            <EmployerFields 
              formData={formData}
              handleChange={handleChange}
            />
          )}

          {profile.role === USER_ROLES.INSTITUTION_PARTNER && (
            <InstitutionFields 
              formData={formData}
              handleChange={handleChange}
            />
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Role-specific content display */}
      {!isEditing && (
        <>
          {profile.role === USER_ROLES.JOB_SEEKER && (
            <JobSeekerProfileDisplay profile={profile} />
          )}
          
          {profile.role === USER_ROLES.EMPLOYER && (
            <EmployerProfileDisplay profile={profile} />
          )}
          
          {profile.role === USER_ROLES.INSTITUTION_PARTNER && (
            <InstitutionProfileDisplay profile={profile} />
          )}
        </>
      )}
    </div>
  )
}

// Job Seeker Fields Component
function JobSeekerFields({ formData, handleChange, skills, handleSkillsChange }) {
  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Job Seeker Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <select
            name="experience_years"
            value={formData.experience_years}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select experience</option>
            <option value="0">Entry Level (0 years)</option>
            <option value="1">1-2 years</option>
            <option value="3">3-5 years</option>
            <option value="6">6-10 years</option>
            <option value="11">10+ years</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Education Level
          </label>
          <select
            name="education_level"
            value={formData.education_level}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select education</option>
            <option value="High School">High School</option>
            <option value="Associate">Associate Degree</option>
            <option value="Bachelor">Bachelor's Degree</option>
            <option value="Master">Master's Degree</option>
            <option value="PhD">PhD</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Salary Min ($)
          </label>
          <input
            type="number"
            name="expected_salary_min"
            value={formData.expected_salary_min}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Salary Max ($)
          </label>
          <input
            type="number"
            name="expected_salary_max"
            value={formData.expected_salary_max}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skills (comma-separated)
        </label>
        <textarea
          value={skills}
          onChange={handleSkillsChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., JavaScript, React, Node.js, Python"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resume URL
          </label>
          <input
            type="url"
            name="resume_url"
            value={formData.resume_url}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio URL
          </label>
          <input
            type="url"
            name="portfolio_url"
            value={formData.portfolio_url}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn URL
          </label>
          <input
            type="url"
            name="linkedin_url"
            value={formData.linkedin_url}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub URL
          </label>
          <input
            type="url"
            name="github_url"
            value={formData.github_url}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}

// Employer Fields Component
function EmployerFields({ formData, handleChange }) {
  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Website
          </label>
          <input
            type="url"
            name="company_website"
            value={formData.company_website}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Size
          </label>
          <select
            name="company_size"
            value={formData.company_size}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-1000">201-1000 employees</option>
            <option value="1000+">1000+ employees</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry
          </label>
          <select
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select industry</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="Education">Education</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Retail">Retail</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Founded Year
          </label>
          <input
            type="number"
            name="founded_year"
            value={formData.founded_year}
            onChange={handleChange}
            min="1800"
            max={new Date().getFullYear()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Description
        </label>
        <textarea
          name="company_description"
          rows={4}
          value={formData.company_description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your company..."
        />
      </div>
    </div>
  )
}

// Institution Fields Component
function InstitutionFields({ formData, handleChange }) {
  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Institution Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Institution Name
          </label>
          <input
            type="text"
            name="institution_name"
            value={formData.institution_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Institution Type
          </label>
          <select
            name="institution_type"
            value={formData.institution_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select type</option>
            <option value="university">University</option>
            <option value="peso">PESO</option>
            <option value="training_center">Training Center</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Institution Website
          </label>
          <input
            type="url"
            name="institution_website"
            value={formData.institution_website}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Person
          </label>
          <input
            type="text"
            name="contact_person"
            value={formData.contact_person}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email
          </label>
          <input
            type="email"
            name="contact_email"
            value={formData.contact_email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}

// Profile Display Components
function JobSeekerProfileDisplay({ profile }) {
  const jobSeekerProfile = profile.job_seeker_profiles?.[0]
  
  return (
    <div className="space-y-6">
      {/* Skills */}
      {jobSeekerProfile?.skills && jobSeekerProfile.skills.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {jobSeekerProfile.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experience & Links */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobSeekerProfile?.experience_years && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
              <p className="text-gray-900">{jobSeekerProfile.experience_years} years</p>
            </div>
          )}
          {jobSeekerProfile?.education_level && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
              <p className="text-gray-900">{jobSeekerProfile.education_level}</p>
            </div>
          )}
          {(jobSeekerProfile?.expected_salary_min || jobSeekerProfile?.expected_salary_max) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Salary</label>
              <p className="text-gray-900">
                ${jobSeekerProfile.expected_salary_min?.toLocaleString()} - ${jobSeekerProfile.expected_salary_max?.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobSeekerProfile?.resume_url && (
            <a
              href={jobSeekerProfile.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <BriefcaseIcon className="h-4 w-4 mr-2" />
              View Resume
            </a>
          )}
          {jobSeekerProfile?.portfolio_url && (
            <a
              href={jobSeekerProfile.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              View Portfolio
            </a>
          )}
          {jobSeekerProfile?.linkedin_url && (
            <a
              href={jobSeekerProfile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              LinkedIn
            </a>
          )}
          {jobSeekerProfile?.github_url && (
            <a
              href={jobSeekerProfile.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function EmployerProfileDisplay({ profile }) {
  const employerProfile = profile.employer_profiles?.[0]
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {employerProfile?.company_name && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <p className="text-gray-900">{employerProfile.company_name}</p>
          </div>
        )}
        {employerProfile?.industry && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <p className="text-gray-900">{employerProfile.industry}</p>
          </div>
        )}
        {employerProfile?.company_size && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
            <p className="text-gray-900">{employerProfile.company_size} employees</p>
          </div>
        )}
        {employerProfile?.founded_year && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Founded</label>
            <p className="text-gray-900">{employerProfile.founded_year}</p>
          </div>
        )}
      </div>
      
      {employerProfile?.company_description && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">About the Company</label>
          <p className="text-gray-900">{employerProfile.company_description}</p>
        </div>
      )}

      {employerProfile?.company_website && (
        <div className="mt-6">
          <a
            href={employerProfile.company_website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Visit Website
          </a>
        </div>
      )}
    </div>
  )
}

function InstitutionProfileDisplay({ profile }) {
  const institutionProfile = profile.institution_partners?.[0]
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Institution Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {institutionProfile?.institution_name && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
            <p className="text-gray-900">{institutionProfile.institution_name}</p>
          </div>
        )}
        {institutionProfile?.institution_type && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <p className="text-gray-900 capitalize">{institutionProfile.institution_type.replace('_', ' ')}</p>
          </div>
        )}
        {institutionProfile?.contact_person && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <p className="text-gray-900">{institutionProfile.contact_person}</p>
          </div>
        )}
        {institutionProfile?.contact_email && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <p className="text-gray-900">{institutionProfile.contact_email}</p>
          </div>
        )}
      </div>

      {institutionProfile?.institution_website && (
        <div className="mt-6">
          <a
            href={institutionProfile.institution_website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Visit Website
          </a>
        </div>
      )}
    </div>
  )
}