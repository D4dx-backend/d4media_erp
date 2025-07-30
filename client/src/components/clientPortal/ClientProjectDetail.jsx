import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getClientProjectDetails } from '../../services/clientPortalService';
import LoadingSpinner from '../common/LoadingSpinner';

const ClientProjectDetail = () => {
  const { departmentId } = useParams();
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        const response = await getClientProjectDetails(departmentId);
        setProjectData(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load project details. Please try again later.');
        console.error('Error fetching project details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (departmentId) {
      fetchProjectDetails();
    }
  }, [departmentId]);

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

  if (!projectData) {
    return null;
  }

  const { tasks, stats } = projectData;
  const departmentName = tasks.length > 0 ? tasks[0].department.name : 'Project';

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'active') {
      return !['completed', 'cancelled'].includes(task.status);
    } else if (activeTab === 'completed') {
      return task.status === 'completed';
    } else if (activeTab === 'all') {
      return true;
    }
    return false;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link to="/client/projects" className="text-blue-600 hover:underline text-sm">
            ← Back to Projects
          </Link>
          <h1 className="text-2xl font-bold mt-2">{departmentName}</h1>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Tasks" 
          value={stats.totalTasks} 
          icon="📋"
        />
        <StatCard 
          title="Completed" 
          value={stats.completedTasks} 
          icon="✅"
        />
        <StatCard 
          title="Overdue" 
          value={stats.overdueTasks} 
          icon="⚠️"
        />
        <StatCard 
          title="Progress" 
          value={`${stats.progress}%`} 
          icon="📊"
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">Project Progress</h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-blue-600 h-4 rounded-full" 
            style={{ width: `${stats.progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'active'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Tasks
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'completed'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed Tasks
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'all'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Tasks
            </button>
          </nav>
        </div>

        {filteredTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/client/tasks/${task._id}`} className="text-blue-600 hover:underline">
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${task.progress?.percentage || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {task.progress?.percentage || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.assignedTo?.name || 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">No {activeTab} tasks found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper components
const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex items-end">
        <span className="text-3xl font-bold">{value}</span>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { label: 'Pending', classes: 'bg-gray-100 text-gray-800' },
    in_progress: { label: 'In Progress', classes: 'bg-blue-100 text-blue-800' },
    review: { label: 'In Review', classes: 'bg-yellow-100 text-yellow-800' },
    completed: { label: 'Completed', classes: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-800' },
  };

  const config = statusConfig[status] || { label: status, classes: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${config.classes}`}>
      {config.label}
    </span>
  );
};

export default ClientProjectDetail;