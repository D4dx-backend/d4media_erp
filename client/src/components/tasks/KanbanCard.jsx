import React from 'react';
import { Link } from 'react-router-dom';

const KanbanCard = ({ task, isDragging = false }) => {
  // Priority colors
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  // Calculate days remaining
  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining(task.dueDate);
  const isOverdue = daysRemaining < 0;
  const isDueSoon = daysRemaining <= 2 && daysRemaining >= 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all duration-200 cursor-grab active:cursor-grabbing ${
      isDragging 
        ? 'shadow-xl transform rotate-2 scale-105 border-blue-300' 
        : 'hover:shadow-md hover:-translate-y-1'
    }`}>
      {/* Task Title */}
      <div className="mb-2">
        <h4 className="font-medium text-gray-900 line-clamp-2">
          {task.title}
        </h4>
      </div>

      {/* Task Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority] || priorityColors.medium}`}>
          {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || 'Medium'}
        </span>
        
        {/* Due Date */}
        <div className="text-xs">
          {isOverdue ? (
            <span className="text-red-600 font-medium">
              Overdue by {Math.abs(daysRemaining)} days
            </span>
          ) : isDueSoon ? (
            <span className="text-orange-600 font-medium">
              Due in {daysRemaining} days
            </span>
          ) : (
            <span className="text-gray-500">
              Due in {daysRemaining} days
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {task.progress?.percentage !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Progress</span>
            <span className="text-xs text-gray-700 font-medium">
              {task.progress.percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${task.progress.percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Department */}
      {task.department && (
        <div className="mb-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {task.department.name}
          </span>
        </div>
      )}

      {/* Assigned To */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {task.assignedTo ? (
            <div className="flex items-center">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {task.assignedTo.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="ml-2 text-xs text-gray-600 truncate max-w-20">
                {task.assignedTo.name}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Unassigned</span>
          )}
        </div>

        {/* Attachments indicator */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="flex items-center text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="ml-1 text-xs">{task.attachments.length}</span>
          </div>
        )}
      </div>

      {/* Task Type */}
      {task.taskType && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {task.taskType}
          </span>
        </div>
      )}

      {/* Time tracking indicator */}
      {task.timeEntries && task.timeEntries.length > 0 && (
        <div className="mt-2 flex items-center text-gray-500">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs">
            {task.actualHours?.toFixed(1) || 0}h logged
          </span>
        </div>
      )}
    </div>
  );
};

export default KanbanCard;