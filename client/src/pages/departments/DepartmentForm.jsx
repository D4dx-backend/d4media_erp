import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import departmentService from '../../services/departmentService';
import userService from '../../services/userService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DepartmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableAdmins, setAvailableAdmins] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    admin: '',
    settings: {
      defaultTaskPriority: 'medium',
      autoAssignment: false,
      requireApproval: false
    },
    taskTypes: []
  });

  const [newTaskType, setNewTaskType] = useState({
    name: '',
    estimatedHours: 1,
    billingRate: 0
  });

  useEffect(() => {
    fetchAvailableAdmins();
    if (isEditing) {
      fetchDepartment();
    }
  }, [id, isEditing]);

  const fetchAvailableAdmins = async () => {
    try {
      console.log('Fetching available admins...');
      // Fetch users who can be department admins
      const response = await userService.getUsers({ 
        role: 'department_admin,super_admin',
        isActive: true 
      });
      console.log('Available admins response:', response);
      if (response && response.data) {
        setAvailableAdmins(response.data);
      } else {
        console.error('Invalid response format for available admins:', response);
      }
    } catch (err) {
      console.error('Failed to fetch available admins:', err);
    }
  };

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getDepartment(id);
      const department = response.data;
      
      setFormData({
        name: department.name || '',
        code: department.code || '',
        description: department.description || '',
        admin: department.admin?._id || '',
        settings: {
          defaultTaskPriority: department.settings?.defaultTaskPriority || 'medium',
          autoAssignment: department.settings?.autoAssignment || false,
          requireApproval: department.settings?.requireApproval || false
        },
        taskTypes: department.taskTypes || []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleTaskTypeChange = (e) => {
    const { name, value } = e.target;
    setNewTaskType(prev => ({
      ...prev,
      [name]: name === 'estimatedHours' || name === 'billingRate' ? parseFloat(value) || 0 : value
    }));
  };

  const addTaskType = () => {
    if (newTaskType.name.trim()) {
      setFormData(prev => ({
        ...prev,
        taskTypes: [...prev.taskTypes, { ...newTaskType }]
      }));
      setNewTaskType({ name: '', estimatedHours: 1, billingRate: 0 });
    }
  };

  const removeTaskType = (index) => {
    setFormData(prev => ({
      ...prev,
      taskTypes: prev.taskTypes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Ensure code is uppercase before submitting
      const submissionData = {
        ...formData,
        code: formData.code.toUpperCase()
      };
      
      // If admin is empty string, set it to null to avoid validation error
      if (submissionData.admin === '') {
        submissionData.admin = null;
      }
      
      // Log the data being submitted for debugging
      console.log('Submitting department data:', submissionData);
      
      if (isEditing) {
        await departmentService.updateDepartment(id, submissionData);
      } else {
        const result = await departmentService.createDepartment(submissionData);
        console.log('Department creation result:', result);
      }
      navigate('/departments');
    } catch (err) {
      console.error('Department form submission error:', err);
      
      // Handle specific error cases
      if (err.message && err.message.includes('already exists')) {
        setError('A department with this name or code already exists. Please use different values.');
      } else if (err.message && err.message.includes('Validation failed')) {
        setError(err.message);
      } else {
        setError(err.message || 'An error occurred while saving the department. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Department' : 'Create New Department'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing ? 'Update department information and settings' : 'Add a new department to the system'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Department Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Graphic Design"
              />
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Department Code *
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., GD"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the department"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="admin" className="block text-sm font-medium text-gray-700 mb-1">
              Department Admin
            </label>
            <select
              id="admin"
              name="admin"
              value={formData.admin}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an admin (optional)</option>
              {availableAdmins.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Department Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Department Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="defaultTaskPriority" className="block text-sm font-medium text-gray-700 mb-1">
                Default Task Priority
              </label>
              <select
                id="defaultTaskPriority"
                name="settings.defaultTaskPriority"
                value={formData.settings.defaultTaskPriority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoAssignment"
                name="settings.autoAssignment"
                checked={formData.settings.autoAssignment}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoAssignment" className="ml-2 block text-sm text-gray-700">
                Enable Auto Assignment
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireApproval"
                name="settings.requireApproval"
                checked={formData.settings.requireApproval}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requireApproval" className="ml-2 block text-sm text-gray-700">
                Require Task Approval
              </label>
            </div>
          </div>
        </div>

        {/* Task Types */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Task Types</h2>
          
          {/* Add New Task Type */}
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add Task Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <input
                  type="text"
                  name="name"
                  value={newTaskType.name}
                  onChange={handleTaskTypeChange}
                  placeholder="Task type name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="number"
                  name="estimatedHours"
                  value={newTaskType.estimatedHours}
                  onChange={handleTaskTypeChange}
                  placeholder="Hours"
                  min="0.1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex">
                <input
                  type="number"
                  name="billingRate"
                  value={newTaskType.billingRate}
                  onChange={handleTaskTypeChange}
                  placeholder="Rate"
                  min="0"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addTaskType}
                  className="px-3 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Existing Task Types */}
          {formData.taskTypes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Current Task Types</h3>
              {formData.taskTypes.map((taskType, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium">{taskType.name}</span>
                    <span className="text-gray-500 ml-2">
                      ({taskType.estimatedHours}h @ ${taskType.billingRate}/h)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTaskType(index)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col md:flex-row gap-3 md:justify-end">
          <button
            type="button"
            onClick={() => navigate('/departments')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Department' : 'Create Department')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DepartmentForm;