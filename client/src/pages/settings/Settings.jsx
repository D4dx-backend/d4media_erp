import React, { useState } from 'react'
import NotificationPreferences from '../../components/notifications/NotificationPreferences'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('notifications')
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'account'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('account')}
            >
              Account
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'notifications'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'security'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'notifications' && (
            <NotificationPreferences />
          )}
          {activeTab === 'account' && (
            <p className="text-gray-500 text-center py-8">
              Account settings will be implemented in upcoming tasks.
            </p>
          )}
          {activeTab === 'security' && (
            <p className="text-gray-500 text-center py-8">
              Security settings will be implemented in upcoming tasks.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings