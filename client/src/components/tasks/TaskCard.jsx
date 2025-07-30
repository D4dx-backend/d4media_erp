import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TOUCH_LIST_ITEM_CLASSES } from '../../utils/touchFriendly';

const TaskCard = ({ task }) => {
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    navigate(`/tasks/${task._id}`);
  };
  // Helper function to determine status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-200 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Helper function to determine priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date to readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days remaining or overdue
  const getDaysIndicator = () => {
    if (task.isOverdue) {
      return (
        <span className="text-red-600 text-sm font-medium">
          Overdue by {Math.abs(task.daysRemaining)} days
        </span>
      );
    }
    
    if (task.daysRemaining === 0) {
      return <span className="text-orange-600 text-sm font-medium">Due today</span>;
    }
    
    if (task.daysRemaining > 0) {
      return (
        <span className="text-gray-600 text-sm">
          {task.daysRemaining} days remaining
        </span>
      );
    }
    
    return null;
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
        task.isUrgent ? 'border-red-500' : 'border-blue-500'
      } hover:shadow-lg transition-shadow active:bg-gray-50 cursor-pointer`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`View task: ${task.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {task.title}
        </h3>
        <div className="flex space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
      
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <span className="text-gray-700 text-sm mr-1">Department:</span>
          <span className="text-gray-900 text-sm font-medium">{task.department?.name || 'Unassigned'}</span>
        </div>
        <div>
          {getDaysIndicator()}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-gray-700 text-sm mr-1">Assigned to:</span>
          <span className="text-gray-900 text-sm font-medium">
            {task.assignedTo?.name || 'Unassigned'}
          </span>
        </div>
        <div className="text-gray-600 text-sm">
          Due: {formatDate(task.dueDate)}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">Progress</span>
          <span className="text-xs font-medium text-gray-900">{task.progress?.percentage || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${task.progress?.percentage || 0}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;