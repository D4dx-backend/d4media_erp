import React, { useState, useEffect } from 'react'
import { Menu, User, LogOut, Settings, Search, X, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import NotificationCenter from '../notifications/NotificationCenter'
import { useLocation, useNavigate } from 'react-router-dom'

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Get current page title based on location
  const getPageTitle = () => {
    const path = location.pathname.split('/')[1]
    if (!path) return 'Dashboard'
    return path.charAt(0).toUpperCase() + path.slice(1)
  }

  // Handle back navigation
  const handleBack = () => {
    navigate(-1)
  }

  // Handle scroll events to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Handle global search
  const handleSearch = async (query) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      // Mock search results - in real implementation, this would call an API
      const mockResults = [
        {
          type: 'task',
          id: '1',
          title: `Task containing "${query}"`,
          description: 'Task description...',
          url: '/tasks/1'
        },
        {
          type: 'equipment',
          id: '2',
          title: `Equipment: ${query}`,
          description: 'Equipment description...',
          url: '/equipment'
        },
        {
          type: 'user',
          id: '3',
          title: `User: ${query}`,
          description: 'User profile...',
          url: '/users'
        }
      ].filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      )

      setSearchResults(mockResults)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Handle search result click
  const handleSearchResultClick = (result) => {
    navigate(result.url)
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  // Determine if we should show back button (for detail pages)
  const showBackButton = location.pathname.split('/').length > 2

  return (
    <header className={`sticky top-0 z-30 bg-white transition-shadow ${
      isScrolled ? 'shadow-md' : 'shadow-sm'
    } border-b border-gray-200`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Menu button or back button */}
          <div className="flex items-center">
            {showBackButton ? (
              <button
                type="button"
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={handleBack}
                aria-label="Go back"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            ) : (
              <button
                type="button"
                className="lg:hidden p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={onMenuClick}
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}

            {/* Logo and page title */}
            <div className={`ml-2 ${showBackButton ? 'lg:ml-2' : 'lg:ml-0'}`}>
              <h1 className="text-lg font-bold text-gray-900 truncate max-w-[150px] sm:max-w-none">
                {showBackButton ? 'Back' : getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            {/* Search button (mobile) */}
            <button
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <NotificationCenter />

            {/* User menu */}
            <div className="relative">
              <button
                className="flex items-center space-x-1 sm:space-x-3 p-2 rounded-full sm:rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
              >
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[100px] md:max-w-none">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize truncate max-w-[100px] md:max-w-none">
                    {user?.role?.replace('_', ' ') || 'Role'}
                  </p>
                </div>
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200 animate-fade-in">
                  <button
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={() => {
                      setDropdownOpen(false)
                      navigate('/settings')
                    }}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    Settings
                  </button>
                  <button
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search overlay (mobile) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex items-center p-4 border-b">
            <button
              className="p-2 rounded-full text-gray-500 hover:text-gray-700"
              onClick={() => setSearchOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <input
              type="text"
              className="flex-1 ml-2 p-2 text-lg border-none focus:ring-0 focus:outline-none"
              placeholder="Search tasks, equipment, users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="p-4">
            {searchLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-500">Searching...</span>
              </div>
            )}
            
            {!searchLoading && searchQuery && searchResults.length === 0 && (
              <p className="text-gray-500 text-center py-4">No results found for "{searchQuery}"</p>
            )}
            
            {!searchLoading && searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-3">Search Results ({searchResults.length})</p>
                {searchResults.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSearchResultClick(result)}
                    className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          result.type === 'task' ? 'bg-blue-100 text-blue-800' :
                          result.type === 'equipment' ? 'bg-green-100 text-green-800' :
                          result.type === 'user' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {result.type}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {result.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!searchQuery && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Start typing to search across the system</p>
                <p className="text-sm text-gray-400 mt-1">Tasks, Equipment, Users, and more...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </header>
  )
}

export default Header