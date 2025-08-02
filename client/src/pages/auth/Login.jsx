import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import D4MediaLogo from '../../components/common/D4MediaLogo'

const Login = () => {
  const [formData, setFormData] = useState({
    email: 'admin@d4media.com',
    password: 'admin123'
  })
  const [isLoading, setIsLoading] = useState(false)
  
  const { login, error, clearError } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) clearError()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await login(formData)
      toast.success('Login successful!')
      
      // Navigate based on user role
      const userRole = response?.user?.role
      if (userRole === 'super_admin') {
        navigate('/dashboard')
      } else if (userRole === 'department_admin') {
        navigate('/dashboard')
      } else if (userRole === 'reception') {
        navigate('/dashboard')
      } else if (userRole === 'client') {
        navigate('/client-portal')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error.message || 'Login failed. Please check your credentials.'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <D4MediaLogo size="2xl" showText={false} />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">D4 Media</h1>
          <p className="text-gray-600 mb-8">Task Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Logo in Card */}
          <div className="flex justify-center">
            <D4MediaLogo size="xl" showText={false} />
          </div>

          <h2 className="text-2xl font-bold text-blue-800 text-center mb-6">
            Sign in to your account
          </h2>

          {/* Welcome Section */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome</h3>
            <p className="text-sm text-gray-600">
              Please sign in to access the D4 Media Task Management System
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="admin@d4media.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            © 2025 D4 Media. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login