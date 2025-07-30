import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { activityService } from '../../services/activityService';
import { 
  ShieldCheckIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const SystemActivities = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 100,
    action: '',
    resource: '',
    user: '',
    success: '',
    startDate: '',
    endDate: ''
  });
  const [activeTab, setActiveTab] = useState('activities');

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchSystemActivities();
      fetchActivityStats();
    }
  }, [filters, user]);

  const fetchSystemActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching system activities with filters:', filters);
      
      const response = await activityService.getSystemActivities(filters);
      console.log('System activities response:', response);
      
      if (response && response.data) {
        setActivities(response.data || []);
        setPagination(response.pagination || {});
      } else {
        setActivities([]);
        setPagination({});
      }
    } catch (err) {
      console.error('Error fetching system activities:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch system activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityStats = async () => {
    try {
      const response = await activityService.getActivityStats({
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch activity stats:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">You need super admin privileges to view system activities.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShieldCheckIcon className="h-8 w-8 mr-3 text-red-600" />
            System Activities
          </h1>
          <p className="text-gray-600 mt-1">Monitor all system activities and user actions</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('activities')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activities'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Activities
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Statistics
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'activities' && (
          <>
            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <select
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Actions</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="invoice_create">Invoice Create</option>
                    <option value="invoice_update">Invoice Update</option>
                    <option value="quotation_create">Quotation Create</option>
                    <option value="quotation_update">Quotation Update</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resource</label>
                  <select
                    value={filters.resource}
                    onChange={(e) => handleFilterChange('resource', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Resources</option>
                    <option value="invoice">Invoice</option>
                    <option value="quotation">Quotation</option>
                    <option value="task">Task</option>
                    <option value="user">User</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Activities List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">System Activities</h2>
                {pagination.total && (
                  <p className="text-sm text-gray-600 mt-1">
                    {pagination.total} total activities
                  </p>
                )}
              </div>

              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading activities...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="p-8 text-center">
                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No activities found</p>
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div key={activity._id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`p-2 rounded-full ${activity.success ? 'bg-green-100' : 'bg-red-100'}`}>
                            {activity.success ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircleIcon className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {activity.user?.name || 'Unknown User'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {activity.details?.description || `${activity.action.replace(/_/g, ' ')} ${activity.resource}`}
                              </p>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-xs text-gray-500">
                                  {activity.user?.email}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {activity.user?.role?.replace(/_/g, ' ')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  IP: {activity.ipAddress}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                              {activity.duration && (
                                <p className="text-xs text-gray-400">
                                  {activity.duration}ms
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {activity.errorMessage && (
                            <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                              {activity.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <span className="text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* Action Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.actionStats?.map((stat) => (
                  <div key={stat._id} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900">{stat._id.replace(/_/g, ' ')}</h4>
                    <p className="text-2xl font-bold text-blue-600">{stat.count}</p>
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="text-green-600">{stat.successCount} success</span>
                      {stat.failureCount > 0 && (
                        <span className="text-red-600 ml-2">{stat.failureCount} failed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.resourceStats?.map((stat) => (
                  <div key={stat._id} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900">{stat._id.replace(/_/g, ' ')}</h4>
                    <p className="text-2xl font-bold text-green-600">{stat.count}</p>
                    <p className="text-sm text-gray-500">{stat.uniqueUsers} unique users</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Active Users */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Users</h3>
              <div className="space-y-3">
                {stats.userStats?.map((stat) => (
                  <div key={stat._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <UserGroupIcon className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{stat.user?.name}</p>
                        <p className="text-sm text-gray-500">{stat.user?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{stat.count}</p>
                      <p className="text-xs text-gray-500">
                        Last: {new Date(stat.lastActivity).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemActivities;