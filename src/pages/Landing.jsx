// src/pages/Landing.jsx
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import logo from "../assets/logo.jpg";
import svgBG from "../assets/ill.png";
import { 
  BriefcaseIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  HeartIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>JobFinder - Find Your Dream Job with Smart Matching</title>
        <meta name="description" content="Revolutionary job search platform with swipe-based matching. Connect job seekers and employers through intelligent matchmaking. Join thousands of professionals finding their perfect career match." />
        <meta name="keywords" content="job search, career, employment, job matching, recruitment, hiring, swipe jobs" />
      </Helmet>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-50 bg-white shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="h-12 w-12 flex items-center justify-center"
              >
                <img 
                  src={logo} 
                  alt="Logo" 
                  className="h-12 w-12 rounded-lg object-cover"
                />
              </motion.div>
              <span className="ml-2 text-xl font-bold text-gray-900">JobFinder</span>
            </div>
            <div className="flex items-center space-x-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Get Started
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="absolute inset-0">
          <motion.div 
            animate={{ 
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear"
            }}
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-2"
            >
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight"
              >
                Find Your
                <motion.span 
                  className="text-blue-600"
                  animate={{ 
                    color: ['#2563eb', '#7c3aed', '#2563eb'],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                > Dream Job </motion.span>
                with Smart Matching
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-6 text-xl text-gray-600 leading-relaxed"
              >
                Revolutionary job search experience with swipe-based matching. 
                Connect with the right opportunities and employers through our 
                intelligent platform designed for the modern job market.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-8"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Start Your Journey
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="mt-8 flex items-center space-x-8 text-sm text-gray-500"
              >
                {[
                  "Free to join",
                  "Smart matching", 
                  "Secure platform"
                ].map((text, index) => (
                  <motion.div 
                    key={text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                    className="flex items-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, delay: index * 0.5, repeat: Infinity }}
                    >
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    </motion.div>
                    {text}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="lg:col-span-3 relative flex justify-center items-center"
            >
              <motion.div
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative w-full"
              >
                <motion.img 
                  src={svgBG} 
                  alt="JobFinder Illustration" 
                  className="w-full h-auto object-contain"
                  style={{ maxWidth: '900px' }}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                />
                
                {/* Floating elements around the SVG */}
                <motion.div
                  className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500 rounded-full opacity-80"
                  animate={{ 
                    y: [0, -10, 0],
                    x: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    delay: 0
                  }}
                />
                <motion.div
                  className="absolute -bottom-6 -left-6 w-6 h-6 bg-purple-500 rounded-full opacity-70"
                  animate={{ 
                    y: [0, -15, 0],
                    x: [0, -8, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    delay: 1
                  }}
                />
                <motion.div
                  className="absolute top-1/4 -left-8 w-4 h-4 bg-green-500 rounded-full opacity-60"
                  animate={{ 
                    y: [0, -12, 0],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    duration: 5,
                    repeat: Infinity,
                    delay: 2
                  }}
                />
                
                {/* Glowing effect behind SVG */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 blur-3xl"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.3, 0.2]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ zIndex: -1 }}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose JobFinder?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our innovative platform combines the simplicity of modern dating apps 
              with the power of AI-driven job matching to revolutionize your career search.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: HeartIcon,
                title: "Swipe-Based Matching",
                description: "Discover jobs effortlessly with our intuitive swipe interface. Like what you see? Swipe right to apply instantly.",
                color: "text-red-600"
              },
              {
                icon: ChartBarIcon,
                title: "Smart AI Matching",
                description: "Our advanced algorithm analyzes your skills, experience, and preferences to show you the most relevant opportunities.",
                color: "text-blue-600"
              },
              {
                icon: ShieldCheckIcon,
                title: "Verified Employers",
                description: "Every employer undergoes thorough verification to ensure you're connecting with legitimate companies and opportunities.",
                color: "text-green-600"
              },
              {
                icon: UserGroupIcon,
                title: "Real-Time Communication",
                description: "Connect directly with hiring managers and recruiters through our built-in messaging system.",
                color: "text-purple-600"
              },
              {
                icon: BriefcaseIcon,
                title: "Career Analytics",
                description: "Track your application progress, get insights on your profile performance, and optimize your job search strategy.",
                color: "text-orange-600"
              },
              {
                icon: BuildingOfficeIcon,
                title: "Company Insights",
                description: "Get detailed information about company culture, benefits, and employee reviews to make informed decisions.",
                color: "text-indigo-600"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ 
                  y: -8,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 cursor-pointer"
              >
                <motion.div 
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-opacity-10 mb-6 ${feature.color.replace('text-', 'bg-')}`}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: 5
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How JobFinder Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in minutes and begin discovering opportunities that match your career goals.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Create Your Profile",
                description: "Build a comprehensive profile showcasing your skills, experience, and career preferences. Upload your resume and portfolio to stand out.",
                image: "👤"
              },
              {
                step: "02",
                title: "Discover & Swipe",
                description: "Browse through personalized job recommendations. Swipe right on positions you like, left on ones you don't. It's that simple!",
                image: "📱"
              },
              {
                step: "03",
                title: "Connect & Get Hired",
                description: "When you match with an employer, start chatting instantly. Schedule interviews, negotiate offers, and land your dream job.",
                image: "🤝"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative mb-8">
                  <motion.div 
                    className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-4xl"
                    whileHover={{ 
                      scale: 1.1,
                      rotate: 10
                    }}
                    animate={{ 
                      y: [0, -5, 0]
                    }}
                    transition={{ 
                      y: { duration: 2, repeat: Infinity, delay: index * 0.5 },
                      hover: { type: "spring", stiffness: 300 }
                    }}
                  >
                    {step.image}
                  </motion.div>
                  <motion.div 
                    className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                    animate={{ 
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3
                    }}
                  >
                    {step.step}
                  </motion.div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Ready to Find Your Dream Job?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have already discovered their perfect career match. 
              Your next opportunity is just a swipe away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/register?role=job_seeker"
                  className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  I'm Looking for a Job
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/register?role=employer"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 transition-colors shadow-sm hover:shadow-md"
                >
                  I'm Hiring Talent
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BriefcaseIcon className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">JobFinder</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Revolutionizing the way people find jobs and hire talent through 
                intelligent matching and seamless user experience.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Job Seekers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Create Profile</Link></li>
                <li><Link to="/career-advice" className="hover:text-white transition-colors">Career Advice</Link></li>
                <li><Link to="/salary-guide" className="hover:text-white transition-colors">Salary Guide</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Employers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/post-job" className="hover:text-white transition-colors">Post a Job</Link></li>
                <li><Link to="/browse-candidates" className="hover:text-white transition-colors">Browse Talent</Link></li>
                <li><Link to="/recruitment-solutions" className="hover:text-white transition-colors">Recruitment Solutions</Link></li>
                <li><Link to="/employer-resources" className="hover:text-white transition-colors">Resources</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/press" className="hover:text-white transition-colors">Press</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 JobFinder. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}