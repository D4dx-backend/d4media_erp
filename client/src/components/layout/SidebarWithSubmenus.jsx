import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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
  Shield,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const SidebarWithSubmenus = ({ onClose }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [openMenus, setOpenMenus] = useState({})

  const toggleMenu = (menuKey) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }))
  }

  const isMenuActive = (paths) => {
    return paths.some(path => location.pathname.startsWith(path))
  }

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      type: 'single'
    },
    { 
      name: 'Tasks', 
      href: '/tasks', 
      icon: CheckSquare,
      type: 'single'
    },
    {
      name: 'Bookings & Events',
      icon: Calendar,
      type: 'dropdown',
      key: 'bookings',
      items: [
        { name: 'Studio Booking', href: '/studio', icon: Calendar },
        { name: 'External Events', href: '/events', icon: PartyPopper },
        { name: 'Rental Management', href: '/rentals', icon: Package }
      ]
    },
    {
      name: 'Financial',
      icon: FileText,
      type: 'dropdown',
      key: 'financial',
      items: [
        { name: 'Invoices', href: '/invoices', icon: FileText },
        { name: 'Quotations', href: '/quotations', icon: FileCheck }
      ]
    },
    {
      name: 'Activity & Monitoring',
      icon: Clock,
      type: 'dropdown',
      key: 'activity',
      items: [
        { name: 'My Activity History', href: '/activities', icon: Clock }
      ]
    },
    { 
      name: 'Equipment Management', 
      href: '/equipment', 
      icon: Wrench,
      type: 'single'
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: BarChart3,
      type: 'single'
    }
  ]

  // Add admin-only navigation items
  if (user?.role === 'super_admin') {
    // Add admin items to existing menus
    const adminItems = [
      { name: 'Departments', href: '/departments', icon: Building2 },
      { name: 'Users', href: '/users', icon: Users }
    ]
    
    // Insert admin section after tasks
    navigation.splice(2, 0, {
      name: 'Administration',
      icon: Shield,
      type: 'dropdown',
      key: 'admin',
      items: adminItems
    })

    // Add system activities to activity menu
    const activityMenu = navigation.find(item => item.key === 'activity')
    if (activityMenu) {
      activityMenu.items.push({ name: 'System Activities', href: '/system-activities', icon: Shield })
    }
  }

  // Add settings at the end
  navigation.push({ 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings,
    type: 'single'
  })

  const renderMenuItem = (item) => {
    if (item.type === 'single') {
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
          <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
          <span className="truncate">{item.name}</span>
        </NavLink>
      )
    }

    if (item.type === 'dropdown') {
      const isOpen = openMenus[item.key]
      const isActive = isMenuActive(item.items.map(subItem => subItem.href))

      return (
        <div key={item.name}>
          <button
            onClick={() => toggleMenu(item.key)}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {isOpen && (
            <div className="ml-6 mt-1 space-y-1">
              {item.items.map((subItem) => (
                <NavLink
                  key={subItem.name}
                  to={subItem.href}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg text-sm transition-colors min-h-[36px] ${
                      isActive
                        ? 'bg-primary-100 text-primary-800 border-r-2 border-primary-500'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`
                  }
                  onClick={onClose}
                >
                  <subItem.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span className="truncate">{subItem.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  // Auto-open active menus
  React.useEffect(() => {
    const activeMenus = {}
    navigation.forEach(item => {
      if (item.type === 'dropdown' && isMenuActive(item.items.map(subItem => subItem.href))) {
        activeMenus[item.key] = true
      }
    })
    setOpenMenus(prev => ({ ...prev, ...activeMenus }))
  }, [location.pathname])

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
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map(renderMenuItem)}
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

export default SidebarWithSubmenus