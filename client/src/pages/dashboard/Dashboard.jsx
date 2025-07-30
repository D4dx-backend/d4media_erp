import React from 'react'
import { useAuth } from '../../context/AuthContext'
import DashboardStats from '../../components/reports/DashboardStats'

const Dashboard = () => {
  const { user } = useAuth()

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

      <DashboardStats />
    </div>
  )
}

export default Dashboard