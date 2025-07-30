import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import departmentService from '../../services/departmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DepartmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartment();
  }, [id]);

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getDepartment(id);
      setDepartment(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    try {
      await departmentService.toggleDepartmentStatus(id, !department.isActive);
      fetchDepartment(); // Refresh data
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to deactivate this department? This action cannot be undone if there are active tasks or assigned users.')) {
      try {
        await departmentService.deleteDepartment(id);
        navigate('/departments');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center text-gray-500">
          Department not found.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{department.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              department.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {department.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-gray-600">Department Code: {department.code}</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
          <Link
            to={`/departments/${id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            Edit Department
          </Link>
          <button
            onClick={handleStatusToggle}
            className={`px-4 py-2 rounded-lg transition-colors ${
              department.isActive
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {department.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Department Name</label>
                <p className="text-gray-900">{department.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Department Code</label>
                <p className="text-gray-900">{department.code}</p>
              </div>
              
              {department.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900">{department.description}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-gray-900">{department.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900">
                  {new Date(department.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Department Settings */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Department Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Default Task Priority</label>
                <p className="text-gray-900 capitalize">{department.settings?.defaultTaskPriority || 'Medium'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Auto Assignment</label>
                <p className="text-gray-900">{department.settings?.autoAssignment ? 'Enabled' : 'Disabled'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Require Approval</label>
                <p className="text-gray-900">{department.settings?.requireApproval ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Task Types */}
          {department.taskTypes && department.taskTypes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Task Types</h2>
              
              <div className="space-y-3">
                {department.taskTypes.map((taskType, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{taskType.name}</h3>
                      <p className="text-sm text-gray-500">
                        Estimated: {taskType.estimatedHours} hours
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${taskType.billingRate}/hour</p>
                      <p className="text-sm text-gray-500">Billing Rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Department Admin */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Department Admin</h2>
            
            {department.admin ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {department.admin.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{department.admin.name}</p>
                  <p className="text-sm text-gray-500">{department.admin.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No admin assigned</p>
            )}
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Statistics</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Staff Members</span>
                <span className="font-medium text-gray-900">{department.staffCount || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Active Tasks</span>
                <span className="font-medium text-gray-900">{department.activeTasksCount || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Task Types</span>
                <span className="font-medium text-gray-900">{department.taskTypes?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="space-y-2">
              <Link
                to={`/tasks?department=${id}`}
                className="block w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View Department Tasks
              </Link>
              
              <Link
                to={`/users?department=${id}`}
                className="block w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View Department Staff
              </Link>
              
              <Link
                to={`/reports?department=${id}`}
                className="block w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Department Reports
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetail;