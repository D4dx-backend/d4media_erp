import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClientProjects } from '../../services/clientPortalService';
import LoadingSpinner from '../common/LoadingSpinner';

const ClientProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'dueDate',
    sortOrder: 'asc'
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await getClientProjects(filters);
        setProjects(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load projects. Please try again later.');
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-500">{error}</p>
        <button 
          className="mt-2 bg-red-100 text-red-700 px-4 py-2 rounded-md"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Projects</h1>
        
        <div className="flex space-x-4">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="completed">Completed</option>
          </select>
          
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="dueDate">Due Date</option>
            <option value="createdAt">Created Date</option>
            <option value="title">Title</option>
          </select>
          
          <select
            name="sortOrder"
            value={filters.sortOrder}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.departmentId} project={project} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 p-8 text-center rounded-lg">
          <p className="text-gray-500">No projects found.</p>
        </div>
      )}
    </div>
  );
};

const ProjectCard = ({ project }) => {
  const { departmentId, departmentName, tasks, progress, totalTasks, completedTasks } = project;

  // Get the most recent task
  const recentTask = tasks.length > 0 
    ? tasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
    : null;

  // Get the next due task
  const nextDueTask = tasks.length > 0 
    ? tasks
        .filter(task => task.status !== 'completed' && task.status !== 'cancelled')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]
    : null;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">
          <Link to={`/client/projects/${departmentId}`} className="text-blue-600 hover:underline">
            {departmentName}
          </Link>
        </h2>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            {completedTasks} of {totalTasks} tasks completed
          </div>
          <div className="text-sm font-medium">
            {progress}%
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {nextDueTask && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700">Next Due:</h3>
            <div className="mt-1 text-sm">
              <Link to={`/client/tasks/${nextDueTask._id}`} className="text-blue-600 hover:underline">
                {nextDueTask.title}
              </Link>
              <div className="text-xs text-gray-500 mt-1">
                Due: {new Date(nextDueTask.dueDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
        
        {recentTask && (
          <div>
            <h3 className="text-sm font-medium text-gray-700">Recent Update:</h3>
            <div className="mt-1 text-sm">
              <Link to={`/client/tasks/${recentTask._id}`} className="text-blue-600 hover:underline">
                {recentTask.title}
              </Link>
              <div className="text-xs text-gray-500 mt-1">
                Updated: {new Date(recentTask.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 px-6 py-3">
        <Link 
          to={`/client/projects/${departmentId}`}
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          View Project Details →
        </Link>
      </div>
    </div>
  );
};

export default ClientProjectList;