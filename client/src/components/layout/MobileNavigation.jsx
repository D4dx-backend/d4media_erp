import React, { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  Settings,
  Building2,
  Users,
  ChevronUp,
  Plus,
  Check,
  UserCheck,
  Bell
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const MobileNavigation = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [showNavigation, setShowNavigation] = useState(true)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [expanded, setExpanded] = useState(false)

  // Minimum swipe distance in pixels
  const minSwipeDistance = 50

  // Create a reference for the navigation element
  const navRef = useRef(null)
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Studio', href: '/studio', icon: Calendar },
    { name: 'Notifs', href: '/notifications', icon: Bell },
  ]

  // Add admin-only navigation items for mobile
  if (user?.role === 'super_admin') {
    navigation.push(
      { name: 'Depts', href: '/departments', icon: Building2 },
      { name: 'Users', href: '/users', icon: Users }
    )
  } else {
    // For non-admin users, add reports
    navigation.push({ name: 'Reports', href: '/reports', icon: BarChart3 })
  }

  // Settings is always the last item
  navigation.push({ name: 'Settings', href: '/settings', icon: Settings })

  // Handle scroll direction to hide/show navigation with improved performance
  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Scrolling down - hide navigation
            setShowNavigation(false)
          } else {
            // Scrolling up - show navigation
            setShowNavigation(true)
          }
          
          lastScrollY = currentScrollY
          ticking = false
        })
        
        ticking = true
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Touch event handlers for swipe gestures
  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientY)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isUpSwipe = distance > minSwipeDistance
    const isDownSwipe = distance < -minSwipeDistance
    
    // Swipe up - hide navigation or collapse expanded view
    if (isUpSwipe) {
      if (expanded) {
        setExpanded(false)
      } else {
        setShowNavigation(false)
      }
    }
    
    // Swipe down - show navigation or expand for more options
    if (isDownSwipe) {
      setShowNavigation(true)
      if (location.pathname.includes('/tasks')) {
        setExpanded(true)
      }
    }
  }

  // Handle quick actions
  const handleQuickAction = (action) => {
    switch (action) {
      case 'new-task':
        navigate('/tasks?action=create')
        break
      case 'complete':
        // This would typically be handled by the task list component
        console.log('Quick complete action')
        break
      case 'reassign':
        // This would typically be handled by the task list component
        console.log('Quick reassign action')
        break
      default:
        break
    }
    setExpanded(false)
  }

  // Render expanded task actions when in tasks view and expanded
  const renderExpandedTaskActions = () => {
    if (!expanded || !location.pathname.includes('/tasks')) return null
    
    return (
      <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg rounded-t-xl p-4 animate-slide-up">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => handleQuickAction('new-task')}
            className="flex flex-col items-center justify-center p-4 bg-primary-50 rounded-xl hover:bg-primary-100 active:bg-primary-200 transition-colors min-h-[60px]"
          >
            <Plus className="h-5 w-5 text-primary-600 mb-1" />
            <span className="text-primary-600 text-xs font-medium">New Task</span>
          </button>
          <button 
            onClick={() => handleQuickAction('complete')}
            className="flex flex-col items-center justify-center p-4 bg-success-50 rounded-xl hover:bg-success-100 active:bg-success-200 transition-colors min-h-[60px]"
          >
            <Check className="h-5 w-5 text-success-600 mb-1" />
            <span className="text-success-600 text-xs font-medium">Complete</span>
          </button>
          <button 
            onClick={() => handleQuickAction('reassign')}
            className="flex flex-col items-center justify-center p-4 bg-warning-50 rounded-xl hover:bg-warning-100 active:bg-warning-200 transition-colors min-h-[60px]"
          >
            <UserCheck className="h-5 w-5 text-warning-600 mb-1" />
            <span className="text-warning-600 text-xs font-medium">Reassign</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={navRef}
      className={`fixed left-0 right-0 z-40 transition-all duration-300 ${
        showNavigation ? 'bottom-0' : '-bottom-20'
      }`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {renderExpandedTaskActions()}
      
      <div className="bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
        {expanded && (
          <button 
            onClick={() => setExpanded(false)}
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white rounded-t-lg p-1 shadow-md border border-gray-200 border-b-0"
          >
            <ChevronUp className="h-5 w-5 text-gray-500" />
          </button>
        )}
        
        <div className="flex justify-around">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex flex-col items-center py-2 px-3 rounded-lg min-w-0 flex-1 ${
                    isActive
                      ? 'text-primary-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`
                }
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium truncate">{item.name}</span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MobileNavigation