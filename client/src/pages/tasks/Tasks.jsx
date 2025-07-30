import React, { useState } from 'react';
import TaskFilter from '../../components/tasks/TaskFilter';
import CompactTaskFilter from '../../components/tasks/CompactTaskFilter';
import TaskList from '../../components/tasks/TaskList';
import TaskForm from '../../components/tasks/TaskForm';
import KanbanBoard from '../../components/tasks/KanbanBoard';

const Tasks = () => {
  const [filters, setFilters] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'list' or 'kanban'

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleTaskCreated = () => {
    setShowCreateForm(false);
    // Refresh task list by forcing a re-render
    setFilters({...filters});
  };

  const handleError = (error) => {
    setError(error.response?.data?.error || 'An error occurred while fetching tasks.');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">
            Manage and track your tasks across all departments.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                Kanban
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </div>
            </button>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showCreateForm ? 'Cancel' : 'Create Task'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
          <button 
            className="ml-2 text-red-500 hover:text-red-700" 
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6">
          <TaskForm 
            onSuccess={handleTaskCreated} 
            onCancel={() => setShowCreateForm(false)} 
          />
        </div>
      )}

      <CompactTaskFilter onFilterChange={handleFilterChange} />
      
      <div className="flex-1 min-h-0">
        {viewMode === 'kanban' ? (
          <KanbanBoard filters={filters} onError={handleError} />
        ) : (
          <TaskList filters={filters} onError={handleError} />
        )}
      </div>
    </div>
  );
};

export default Tasks;