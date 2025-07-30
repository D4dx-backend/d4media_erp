import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  Settings,
  X,
  Building2,
  Users,
  PartyPopper,
  Package,
  Wrench,
  FileText,
  FileCheck,
  Clock,
  Shield
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Sidebar = ({ onClose }) => {
  const { user } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Studio Booking', href: '/studio', icon: Calendar },
    { name: 'External Events', href: '/events', icon: PartyPopper },
    { name: 'Rental Management', href: '/rentals', icon: Package },
    { name: 'Equipment Management', href: '/equipment', icon: Wrench },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Quotations', href: '/quotations', icon: FileCheck },
    { name: 'Activity History', href: '/activities', icon: Clock },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ]

  // Add admin-only navigation items
  if (user?.role === 'super_admin') {
    navigation.splice(4, 0, 
      { name: 'Departments', href: '/departments', icon: Building2 },
      { name: 'Users', href: '/users', icon: Users }
    )
    // Add system activities for super admin
    navigation.splice(-1, 0, { name: 'System Activities', href: '/system-activities', icon: Shield })
  }

  navigation.push({ name: 'Settings', href: '/settings', icon: Settings })

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">D4 Media</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-3 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Close sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
              onClick={onClose}
            >
              <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate capitalize">
              {user?.role?.replace('_', ' ') || 'Role'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar