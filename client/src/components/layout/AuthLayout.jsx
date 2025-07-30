import React from 'react'
import { Outlet } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            D4 Media
          </h1>
          <p className="text-gray-600">
            Task Management System
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout