import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { activityService } from '../../services/activityService';
import { 
  ClockIcon, 
  UserIcon, 
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const ActivityHistory = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    action: '',
    resource: '',
    success: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [filters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching activities with filters:', filters);
      
      const response = await activityService.getUserActivities(null, filters);
      console.log('Activity response:', response);
      
      if (response && response.data) {
        setActivities(response.data || []);
        setPagination(response.pagination || {});
      } else {
        setActivities([]);
        setPagination({});
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getActionIcon = (action) => {
    if (action.includes('create')) return <PencilIcon className="h-4 w-4 text-green-500" />;
    if (action.includes('update')) return <PencilIcon className="h-4 w-4 text-blue-500" />;
    if (action.includes('delete')) return <TrashIcon className="h-4 w-4 text-red-500" />;
    if (action.includes('view')) return <EyeIcon className="h-4 w-4 text-gray-500" />;
    if (action === 'login') return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    if (action === 'logout') return <XCircleIcon className="h-4 w-4 text-gray-500" />;
    return <DocumentTextIcon className="h-4 w-4 text-blue-500" />;
  };

  const getActionColor = (action, success) => {
    if (!success) return 'text-red-600 bg-red-50';
    if (action.includes('create')) return 'text-green-600 bg-green-50';
    if (action.includes('update')) return 'text-blue-600 bg-blue-50';
    if (action.includes('delete')) return 'text-red-600 bg-red-50';
    if (action === 'login') return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatResource = (resource) => {
    return resource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Show loading state only on initial load
  if (loading && activities.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <ClockIcon className="h-8 w-8 mr-3 text-blue-600" />
                Activity History
              </h1>
              <p className="text-gray-600 mt-1">Track your system activities and actions</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <option value="view">View</option>
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
                  <option value="department">Department</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.success}
                  onChange={(e) => handleFilterChange('success', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  <option value="true">Success</option>
                  <option value="false">Failed</option>
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

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({
                    page: 1,
                    limit: 50,
                    action: '',
                    resource: '',
                    success: '',
                    startDate: '',
                    endDate: ''
                  })}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => {
                  console.log('Testing activity API...');
                  fetch('/api/v1/activities/test', {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  })
                  .then(res => res.json())
                  .then(data => {
                    console.log('Test response:', data);
                    alert('Test response: ' + JSON.stringify(data));
                  })
                  .catch(err => {
                    console.error('Test error:', err);
                    alert('Test error: ' + err.message);
                  });
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Test API
              </button>
            </div>
          </div>
        )}

        {/* Activities List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
            {pagination.total && (
              <p className="text-sm text-gray-600 mt-1">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} activities
              </p>
            )}
          </div>

          <div className="divide-y divide-gray-200">
            {activities.length === 0 ? (
              <div className="p-8 text-center">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No activities found</p>
                <p className="text-gray-400 text-sm mt-2">
                  {error ? 'There was an error loading activities.' : 'Start using the system to see your activity history here.'}
                </p>
                {!error && (
                  <button
                    onClick={fetchActivities}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Refresh
                  </button>
                )}
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-full ${getActionColor(activity.action, activity.success)}`}>
                        {getActionIcon(activity.action)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {activity.details?.description || `${formatAction(activity.action)} ${formatResource(activity.resource)}`}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(activity.action, activity.success)}`}>
                              {formatAction(activity.action)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatResource(activity.resource)}
                            </span>
                            {!activity.success && (
                              <span className="text-xs text-red-600 font-medium">Failed</span>
                            )}
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
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>IP: {activity.ipAddress}</span>
                        {activity.sessionId && <span>Session: {activity.sessionId.slice(-8)}</span>}
                      </div>
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
      </div>
    </div>
  );
};

export default ActivityHistory;