import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import DashboardStats from '../../components/reports/DashboardStats'
import { QuickReference, SummaryStats } from '../../components/dashboard'
import DashboardOverview from '../../components/dashboard/DashboardOverview'
import { LayoutGrid, Calendar, BarChart3, Home } from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState('overview')

  const views = [
    { id: 'overview', name: 'Overview', icon: Home },
    { id: 'stats', name: 'Statistics', icon: LayoutGrid },
    { id: 'quick', name: 'Quick Reference', icon: Calendar },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 }
  ]

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return <DashboardOverview />
      case 'stats':
        return <SummaryStats />
      case 'quick':
        return <QuickReference />
      case 'analytics':
        return <DashboardStats />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* View Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {views.map((view) => {
              const Icon = view.icon
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`${
                    activeView === view.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {view.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  )
}

export default Dashboard