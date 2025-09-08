// src/lib/constants.js - Updated for all job types
export const APP_CONFIG = {
  name: 'JobFinder',
  version: '1.0.0',
  description: 'Universal job matching platform for all industries',
  url: 'https://jobfinder.com',
  supportEmail: 'support@jobfinder.com'
}

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  JOBS: '/jobs',
  POST_JOB: '/post-job',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  APPLICATIONS: '/applications',
  MESSAGES: '/messages',
  
  // Employer routes
  MY_JOBS: '/my-jobs',
  CANDIDATES: '/candidates',
  
  // Admin routes
  ADMIN: {
    USERS: '/admin/users',
    JOBS: '/admin/jobs',
    REPORTS: '/admin/reports',
    ANALYTICS: '/admin/analytics'
  },
  
  // Institution routes
  STUDENTS: '/students',
  PLACEMENTS: '/placements',
  PROGRAMS: '/programs'
}

export const JOB_CATEGORIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Marketing',
  'Sales',
  'Engineering',
  'Design',
  'Customer Service',
  'Human Resources',
  'Operations',
  'Legal',
  'Construction',
  'Manufacturing',
  'Retail',
  'Hospitality',
  'Transportation',
  'Real Estate',
  'Media',
  'Non-Profit',
  'Government',
  'Agriculture',
  'Arts & Entertainment',
  'Beauty & Wellness',
  'Food & Beverage',
  'Security',
  'Sports & Recreation',
  'Telecommunications',
  'Energy & Utilities',
  'Other'
]

export const EXPERIENCE_LEVELS = [
  { value: '0', label: 'Entry Level (0-1 years)' },
  { value: '1', label: 'Junior (1-3 years)' },
  { value: '3', label: 'Mid-level (3-5 years)' },
  { value: '5', label: 'Senior (5-8 years)' },
  { value: '8', label: 'Lead (8-12 years)' },
  { value: '12', label: 'Executive (12+ years)' }
]

export const EDUCATION_LEVELS = [
  'High School',
  'Associate Degree',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'Doctoral Degree',
  'Professional Certification',
  'Trade School',
  'Some College',
  'Vocational Training',
  'Professional License',
  'Other'
]

export const COMPANY_SIZES = [
  { value: '1-10', label: 'Startup (1-10 employees)' },
  { value: '11-50', label: 'Small (11-50 employees)' },
  { value: '51-200', label: 'Medium (51-200 employees)' },
  { value: '201-1000', label: 'Large (201-1000 employees)' },
  { value: '1000+', label: 'Enterprise (1000+ employees)' }
]

export const SALARY_RANGES = [
  { min: 15000, max: 25000, label: '$15K - $25K' },
  { min: 25000, max: 35000, label: '$25K - $35K' },
  { min: 35000, max: 45000, label: '$35K - $45K' },
  { min: 45000, max: 55000, label: '$45K - $55K' },
  { min: 55000, max: 70000, label: '$55K - $70K' },
  { min: 70000, max: 90000, label: '$70K - $90K' },
  { min: 90000, max: 120000, label: '$90K - $120K' },
  { min: 120000, max: 150000, label: '$120K - $150K' },
  { min: 150000, max: null, label: '$150K+' }
]

// Updated skills to cover all industries
export const COMMON_SKILLS = [
  // Universal/Soft Skills
  'Communication', 'Teamwork', 'Problem Solving', 'Time Management',
  'Leadership', 'Organization', 'Customer Service', 'Attention to Detail',
  'Adaptability', 'Work Ethic', 'Critical Thinking', 'Creativity',
  'Multitasking', 'Stress Management', 'Conflict Resolution',
  
  // Technology (Most common for broad appeal)
  'Microsoft Office', 'Email', 'Data Entry', 'Computer Skills',
  'Internet Research', 'Social Media', 'Basic IT Support',
  
  // Business Skills
  'Project Management', 'Sales', 'Marketing', 'Accounting',
  'Financial Analysis', 'Business Development', 'Negotiation',
  'Presentation Skills', 'Report Writing', 'Budgeting',
  
  // Healthcare & Safety
  'First Aid', 'CPR Certified', 'Safety Protocols', 'Patient Care',
  'Medical Terminology', 'HIPAA Compliance', 'Health & Safety',
  
  // Manual/Technical Skills
  'Equipment Operation', 'Quality Control', 'Maintenance',
  'Manual Labor', 'Driving License', 'Forklift Operation',
  'Machinery Operation', 'Hand Tools', 'Power Tools',
  
  // Service Industry
  'Food Safety', 'Cash Handling', 'POS Systems', 'Retail Experience',
  'Food Service', 'Cleaning', 'Inventory Management',
  'Visual Merchandising', 'Loss Prevention',
  
  // Professional Services
  'Legal Research', 'Document Review', 'Client Relations',
  'Administrative Support', 'Scheduling', 'Phone Etiquette',
  'Filing', 'Record Keeping', 'Database Management',
  
  // Education & Training
  'Teaching', 'Training', 'Mentoring', 'Curriculum Development',
  'Student Assessment', 'Classroom Management', 'Public Speaking',
  
  // Creative & Design
  'Graphic Design', 'Content Creation', 'Writing', 'Photography',
  'Video Editing', 'Adobe Creative Suite', 'Creative Problem Solving',
  
  // Languages (commonly needed)
  'Spanish', 'English', 'Bilingual', 'Translation', 'ASL',
  
  // Industry Certifications
  'Professional License', 'Industry Certification', 'Security Clearance',
  'Food Handler License', 'Real Estate License'
]

export const FILE_TYPES = {
  IMAGES: {
    ACCEPTED: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp']
  },
  DOCUMENTS: {
    ACCEPTED: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    EXTENSIONS: ['.pdf', '.doc', '.docx']
  },
  VIDEOS: {
    ACCEPTED: ['video/mp4', 'video/webm', 'video/ogg'],
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    EXTENSIONS: ['.mp4', '.webm', '.ogg']
  }
}

export const NOTIFICATION_TYPES = {
  APPLICATION_RECEIVED: 'application_received',
  APPLICATION_STATUS_CHANGED: 'application_status_changed',
  JOB_MATCH: 'job_match',
  MESSAGE_RECEIVED: 'message_received',
  PROFILE_VIEWED: 'profile_viewed',
  JOB_ALERT: 'job_alert',
  SYSTEM_UPDATE: 'system_update'
}

export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Basic profile creation',
      'Limited job applications (5/month)',
      'Basic job search',
      'Standard support'
    ],
    limits: {
      applications_per_month: 5,
      saved_jobs: 10,
      profile_visibility: 'limited'
    }
  },
  PREMIUM_JOBSEEKER: {
    name: 'Premium Job Seeker',
    price: 29.99,
    features: [
      'Unlimited job applications',
      'Advanced profile features',
      'Priority visibility to employers',
      'Application tracking insights',
      'Direct messaging with recruiters',
      'Salary insights',
      'Priority support'
    ],
    limits: {
      applications_per_month: -1, // unlimited
      saved_jobs: -1,
      profile_visibility: 'premium'
    }
  },
  EMPLOYER_BASIC: {
    name: 'Employer Basic',
    price: 99.99,
    features: [
      'Post up to 5 jobs',
      'Basic candidate matching',
      'Application management',
      'Company profile page',
      'Basic analytics',
      'Email support'
    ],
    limits: {
      job_posts: 5,
      candidate_searches: 100,
      featured_jobs: 0
    }
  },
  EMPLOYER_PREMIUM: {
    name: 'Employer Premium',
    price: 299.99,
    features: [
      'Unlimited job postings',
      'Advanced candidate matching',
      'Featured job listings',
      'Company branding showcase',
      'Advanced analytics dashboard',
      'Priority candidate visibility',
      'Dedicated account manager',
      'Priority support'
    ],
    limits: {
      job_posts: -1,
      candidate_searches: -1,
      featured_jobs: -1
    }
  }
}

export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  DATE_TIME: 'MMM dd, yyyy HH:mm',
  TIME_AGO: 'relative'
}

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
}

export const SEARCH_FILTERS = {
  EMPLOYMENT_TYPES: [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ],
  SORT_OPTIONS: [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date_desc', label: 'Newest First' },
    { value: 'date_asc', label: 'Oldest First' },
    { value: 'salary_desc', label: 'Highest Salary' },
    { value: 'salary_asc', label: 'Lowest Salary' }
  ]
}

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  URL: /^https?:\/\/.+/,
  LINKEDIN: /^https:\/\/www\.linkedin\.com\/in\/[\w\-]+\/?$/,
  GITHUB: /^https:\/\/github\.com\/[\w\-]+\/?$/
}

export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size is too large. Please choose a smaller file.',
  INVALID_FILE_TYPE: 'Invalid file type. Please choose a supported format.'
}

export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully!',
  APPLICATION_SUBMITTED: 'Application submitted successfully!',
  JOB_SAVED: 'Job saved to your favorites!',
  MESSAGE_SENT: 'Message sent successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  JOB_POSTED: 'Job posted successfully!'
}

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'jobfinder_user_prefs',
  SEARCH_HISTORY: 'jobfinder_search_history',
  RECENT_JOBS: 'jobfinder_recent_jobs',
  THEME: 'jobfinder_theme'
}

export const ANALYTICS_EVENTS = {
  JOB_VIEW: 'job_view',
  JOB_APPLY: 'job_apply',
  JOB_SAVE: 'job_save',
  PROFILE_VIEW: 'profile_view',
  SEARCH_PERFORM: 'search_perform',
  FILTER_APPLY: 'filter_apply',
  USER_REGISTER: 'user_register',
  USER_LOGIN: 'user_login',
  JOB_POST: 'job_post',
  MESSAGE_SEND: 'message_send'
}

// Common benefits across all industries
export const COMMON_BENEFITS = [
  'Health Insurance',
  'Dental Insurance',
  'Vision Insurance',
  'Life Insurance',
  'Retirement Plan (401k)',
  'Paid Time Off',
  'Sick Leave',
  'Flexible Schedule',
  'Remote Work Options',
  'Professional Development',
  'Training Opportunities',
  'Tuition Reimbursement',
  'Employee Discount',
  'Free Parking',
  'Public Transportation Allowance',
  'Wellness Programs',
  'Gym Membership',
  'Free Meals/Snacks',
  'Childcare Assistance',
  'Employee Assistance Program',
  'Performance Bonuses',
  'Overtime Pay',
  'Holiday Pay',
  'Bereavement Leave',
  'Maternity/Paternity Leave',
  'Career Advancement Opportunities',
  'Work-Life Balance',
  'Team Building Activities',
  'Company Events',
  'Stock Options'
]

// Industry-specific job titles for suggestions
export const JOB_TITLES_BY_CATEGORY = {
  'Technology': [
    'Software Engineer', 'Web Developer', 'Data Analyst', 'IT Support',
    'System Administrator', 'Network Engineer', 'Cybersecurity Specialist',
    'Product Manager', 'UX/UI Designer', 'Database Administrator'
  ],
  'Healthcare': [
    'Registered Nurse', 'Medical Assistant', 'Physical Therapist',
    'Pharmacy Technician', 'Medical Receptionist', 'Lab Technician',
    'Radiologic Technologist', 'Respiratory Therapist', 'Medical Coder'
  ],
  'Finance': [
    'Accountant', 'Financial Analyst', 'Bookkeeper', 'Loan Officer',
    'Bank Teller', 'Tax Preparer', 'Financial Advisor', 'Auditor',
    'Credit Analyst', 'Investment Advisor'
  ],
  'Education': [
    'Teacher', 'Substitute Teacher', 'Teaching Assistant', 'Tutor',
    'School Counselor', 'Principal', 'Librarian', 'Special Education Teacher',
    'Curriculum Coordinator', 'Training Specialist'
  ],
  'Marketing': [
    'Marketing Coordinator', 'Digital Marketing Specialist', 'Content Creator',
    'Social Media Manager', 'Brand Manager', 'Marketing Analyst',
    'SEO Specialist', 'Public Relations Specialist', 'Event Coordinator'
  ],
  'Sales': [
    'Sales Representative', 'Account Manager', 'Sales Associate',
    'Business Development Manager', 'Inside Sales Representative',
    'Customer Success Manager', 'Sales Manager', 'Retail Sales'
  ],
  'Customer Service': [
    'Customer Service Representative', 'Call Center Agent', 'Help Desk',
    'Customer Support Specialist', 'Client Relations Coordinator',
    'Technical Support', 'Customer Success Specialist'
  ],
  'Human Resources': [
    'HR Generalist', 'Recruiter', 'HR Assistant', 'Benefits Coordinator',
    'Training Coordinator', 'Payroll Specialist', 'HR Manager',
    'Talent Acquisition Specialist'
  ],
  'Retail': [
    'Sales Associate', 'Cashier', 'Store Manager', 'Assistant Manager',
    'Visual Merchandiser', 'Inventory Specialist', 'Loss Prevention',
    'Customer Service Associate', 'Department Manager'
  ],
  'Hospitality': [
    'Hotel Front Desk', 'Housekeeping', 'Restaurant Server', 'Bartender',
    'Chef', 'Cook', 'Event Coordinator', 'Concierge', 'Hotel Manager',
    'Food Service Worker'
  ],
  'Construction': [
    'Construction Worker', 'Electrician', 'Plumber', 'Carpenter',
    'HVAC Technician', 'Project Manager', 'Foreman', 'Heavy Equipment Operator',
    'Roofer', 'Painter'
  ],
  'Manufacturing': [
    'Production Worker', 'Machine Operator', 'Quality Control Inspector',
    'Warehouse Associate', 'Forklift Operator', 'Assembly Line Worker',
    'Maintenance Technician', 'Production Supervisor'
  ],
  'Transportation': [
    'Truck Driver', 'Delivery Driver', 'Warehouse Associate', 'Dispatcher',
    'Logistics Coordinator', 'Forklift Operator', 'Shipping Clerk',
    'Route Driver', 'Commercial Driver'
  ],
  'Real Estate': [
    'Real Estate Agent', 'Property Manager', 'Leasing Consultant',
    'Real Estate Assistant', 'Appraiser', 'Mortgage Loan Officer',
    'Title Examiner', 'Real Estate Broker'
  ],
  'Security': [
    'Security Guard', 'Security Officer', 'Loss Prevention Specialist',
    'Surveillance Monitor', 'Armed Security', 'Event Security',
    'Corporate Security', 'Campus Security'
  ],
  'Food & Beverage': [
    'Server', 'Bartender', 'Cook', 'Chef', 'Food Service Worker',
    'Barista', 'Kitchen Assistant', 'Restaurant Manager', 'Host/Hostess',
    'Dishwasher', 'Catering Assistant'
  ],
  'Beauty & Wellness': [
    'Hair Stylist', 'Nail Technician', 'Massage Therapist', 'Esthetician',
    'Spa Receptionist', 'Fitness Trainer', 'Yoga Instructor',
    'Salon Manager', 'Wellness Coach'
  ],
  'Agriculture': [
    'Farm Worker', 'Agricultural Technician', 'Livestock Caretaker',
    'Crop Inspector', 'Farm Manager', 'Equipment Operator',
    'Greenhouse Worker', 'Ranch Hand'
  ]
}