import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar,
  UserCheck,
  UserX,
  Shield,
  Lock
} from 'lucide-react'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import PasswordResetModal from '../../components/users/PasswordResetModal'

const UserDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [passwordResetModal, setPasswordResetModal] = useState({
    isOpen: false,
    user: null
  })

  // Check if current user is super admin
  const isSuperAdmin = currentUser?.role === 'super_admin'

  useEffect(() => {
    fetchUser()
  }, [id])

  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await userService.getUser(id)
      setUser(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    try {
      setUpdating(true)
      await userService.toggleUserStatus(id, !user.isActive)
      setUser(prev => ({ ...prev, isActive: !prev.isActive }))
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handlePasswordReset = () => {
    setPasswordResetModal({
      isOpen: true,
      user
    })
  }

  const handlePasswordResetSuccess = () => {
    setError(null)
    // You could show a success message here if needed
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      super_admin: 'bg-purple-100 text-purple-800',
      department_admin: 'bg-blue-100 text-blue-800',
      department_staff: 'bg-green-100 text-green-800',
      reception: 'bg-yellow-100 text-yellow-800',
      client: 'bg-gray-100 text-gray-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const formatRole = (role) => {
    return role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
  }

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Never'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => navigate('/users')}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Back to Users
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500">User not found</p>
          <button
            onClick={() => navigate('/users')}
            className="mt-2 text-primary-600 hover:text-primary-800 underline"
          >
            Back to Users
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/users')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
            <p className="text-sm text-gray-500">View and manage user information</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleStatus}
            disabled={updating}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              user.isActive
                ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                : 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500'
            }`}
          >
            {updating ? (
              <LoadingSpinner size="small" className="mr-2" />
            ) : user.isActive ? (
              <UserX className="h-4 w-4 mr-2" />
            ) : (
              <UserCheck className="h-4 w-4 mr-2" />
            )}
            {user.isActive ? 'Deactivate' : 'Activate'}
          </button>

          {isSuperAdmin && (
            <button
              onClick={handlePasswordReset}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <Lock className="h-4 w-4 mr-2" />
              Reset Password
            </button>
          )}
          
          <Link
            to={`/users/${id}/edit`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Link>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-medium">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-3 mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                  {formatRole(user.role)}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{user.phone}</span>
                  </div>
                )}
                {user.company && (
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{user.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Role & Department */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Role & Department</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{formatRole(user.role)}</span>
                </div>
                {user.department && (
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">
                      {user.department.name} ({user.department.code})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      {(user.address?.street || user.address?.city || user.address?.state || user.address?.country) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="text-gray-900">
              {user.address.street && <div>{user.address.street}</div>}
              <div>
                {[user.address.city, user.address.state, user.address.zipCode]
                  .filter(Boolean)
                  .join(', ')}
              </div>
              {user.address.country && <div>{user.address.country}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Account Created
            </label>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{formatDate(user.createdAt)}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Last Login
            </label>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{formatDate(user.lastLogin)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-900">Email notifications</span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              user.notifications?.email 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {user.notifications?.email ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-900">Task update notifications</span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              user.notifications?.taskUpdates 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {user.notifications?.taskUpdates ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-900">Deadline reminder notifications</span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              user.notifications?.deadlineReminders 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {user.notifications?.deadlineReminders ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      <PasswordResetModal
        isOpen={passwordResetModal.isOpen}
        onClose={() => setPasswordResetModal({ isOpen: false, user: null })}
        user={passwordResetModal.user}
        onSuccess={handlePasswordResetSuccess}
      />
    </div>
  )
}

export default UserDetail