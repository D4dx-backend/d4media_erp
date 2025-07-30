import React, { useEffect } from 'react'
import { X, User, LogOut, Settings, LayoutDashboard, CheckSquare, Calendar, Bell, BarChart3, Building2, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const MobileMenuOverlay = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLogout = async () => {
    try {
      await logout()
      onClose()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleNavigation = (path) => {
    navigate(path)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl transform transition-transform animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-gray-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-sm text-gray-500 truncate capitalize">
                {user?.role?.replace('_', ' ') || 'Role'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 overflow-y-auto">
          <div className="px-4 mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</h3>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleNavigation('/dashboard')}
              className={`flex items-center w-full px-4 py-3 text-left ${location.pathname === '/dashboard' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'} focus:outline-none focus:bg-gray-50`}
            >
              <LayoutDashboard className={`h-5 w-5 mr-3 ${location.pathname === '/dashboard' ? 'text-primary-500' : 'text-gray-400'}`} />
              <span className="text-base">Dashboard</span>
            </button>
            
            <button
              onClick={() => handleNavigation('/tasks')}
              className={`flex items-center w-full px-4 py-3 text-left ${location.pathname.startsWith('/tasks') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'} focus:outline-none focus:bg-gray-50`}
            >
              <CheckSquare className={`h-5 w-5 mr-3 ${location.pathname.startsWith('/tasks') ? 'text-primary-500' : 'text-gray-400'}`} />
              <span className="text-base">Tasks</span>
            </button>
            
            <button
              onClick={() => handleNavigation('/studio')}
              className={`flex items-center w-full px-4 py-3 text-left ${location.pathname.startsWith('/studio') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'} focus:outline-none focus:bg-gray-50`}
            >
              <Calendar className={`h-5 w-5 mr-3 ${location.pathname.startsWith('/studio') ? 'text-primary-500' : 'text-gray-400'}`} />
              <span className="text-base">Studio Booking</span>
            </button>
            
            <button
              onClick={() => handleNavigation('/notifications')}
              className={`flex items-center w-full px-4 py-3 text-left ${location.pathname.startsWith('/notifications') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'} focus:outline-none focus:bg-gray-50`}
            >
              <Bell className={`h-5 w-5 mr-3 ${location.pathname.startsWith('/notifications') ? 'text-primary-500' : 'text-gray-400'}`} />
              <span className="text-base">Notifications</span>
            </button>
            
            {user?.role === 'super_admin' && (
              <>
                <button
                  onClick={() => handleNavigation('/departments')}
                  className={`flex items-center w-full px-4 py-3 text-left ${location.pathname.startsWith('/departments') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'} focus:outline-none focus:bg-gray-50`}
                >
                  <Building2 className={`h-5 w-5 mr-3 ${location.pathname.startsWith('/departments') ? 'text-primary-500' : 'text-gray-400'}`} />
                  <span className="text-base">Departments</span>
                </button>
                
                <button
                  onClick={() => handleNavigation('/users')}
                  className={`flex items-center w-full px-4 py-3 text-left ${location.pathname.startsWith('/users') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'} focus:outline-none focus:bg-gray-50`}
                >
                  <Users className={`h-5 w-5 mr-3 ${location.pathname.startsWith('/users') ? 'text-primary-500' : 'text-gray-400'}`} />
                  <span className="text-base">Users</span>
                </button>
              </>
            )}
            
            {user?.role !== 'super_admin' && (
              <button
                onClick={() => handleNavigation('/reports')}
                className={`flex items-center w-full px-4 py-3 text-left ${location.pathname.startsWith('/reports') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'} focus:outline-none focus:bg-gray-50`}
              >
                <BarChart3 className={`h-5 w-5 mr-3 ${location.pathname.startsWith('/reports') ? 'text-primary-500' : 'text-gray-400'}`} />
                <span className="text-base">Reports</span>
              </button>
            )}
          </div>
          
          <div className="border-t border-gray-200 mt-4 pt-4 px-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account</h3>
            <div className="space-y-1">
              <button
                onClick={() => handleNavigation('/settings')}
                className={`flex items-center w-full px-4 py-3 text-left ${location.pathname.startsWith('/settings') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'} focus:outline-none focus:bg-gray-50`}
              >
                <Settings className={`h-5 w-5 mr-3 ${location.pathname.startsWith('/settings') ? 'text-primary-500' : 'text-gray-400'}`} />
                <span className="text-base">Settings</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
              >
                <LogOut className="h-5 w-5 mr-3 text-gray-400" />
                <span className="text-base">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileMenuOverlay