import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const SystemNotificationForm = () => {
  const { sendSystemNotification } = useNotifications();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'medium',
    sendEmail: false,
    targetType: 'roles', // 'roles' or 'specific'
    roles: [],
    recipients: []
  });
  
  // Check if user has admin privileges
  const isAdmin = user && (user.role === 'super_admin' || user.role === 'department_admin');
  
  if (!isAdmin) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              You don't have permission to send system notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle role selection
  const handleRoleToggle = (role) => {
    setFormData(prev => {
      const roles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role];
      
      return { ...prev, roles };
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    
    if (formData.targetType === 'roles' && formData.roles.length === 0) {
      toast.error('Please select at least one role');
      return;
    }
    
    try {
      setLoading(true);
      
      const notificationData = {
        title: formData.title,
        message: formData.message,
        priority: formData.priority,
        sendEmail: formData.sendEmail,
        roles: formData.targetType === 'roles' ? formData.roles : undefined,
        recipients: formData.targetType === 'specific' ? formData.recipients : undefined
      };
      
      await sendSystemNotification(notificationData);
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        priority: 'medium',
        sendEmail: false,
        targetType: 'roles',
        roles: [],
        recipients: []
      });
      
    } catch (error) {
      console.error('Error sending system notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Send System Notification</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Notification title"
              maxLength={100}
              required
            />
          </div>
          
          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Notification message"
              maxLength={1000}
              required
            />
          </div>
          
          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          
          {/* Send Email */}
          <div className="flex items-center">
            <input
              id="sendEmail"
              name="sendEmail"
              type="checkbox"
              checked={formData.sendEmail}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-700">
              Also send as email
            </label>
          </div>
          
          {/* Target Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Send To
            </label>
            <div className="mt-2 space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="targetType"
                  value="roles"
                  checked={formData.targetType === 'roles'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">User Roles</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="targetType"
                  value="specific"
                  checked={formData.targetType === 'specific'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Specific Users</span>
              </label>
            </div>
          </div>
          
          {/* Role Selection */}
          {formData.targetType === 'roles' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Roles
              </label>
              <div className="space-y-2">
                {['super_admin', 'department_admin', 'department_staff', 'reception', 'client'].map((role) => (
                  <label key={role} className="inline-flex items-center mr-4">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {role.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {/* Specific Users - This would typically use a user search/select component */}
          {formData.targetType === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Users
              </label>
              <p className="text-sm text-gray-500 italic">
                User selection functionality will be implemented in a future update.
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemNotificationForm;