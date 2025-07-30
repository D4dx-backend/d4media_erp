import React, { useState, useEffect } from 'react';
import { getDashboardData } from '../../services/reportService';
import LoadingSpinner from '../common/LoadingSpinner';

const DashboardStats = ({ departmentId = null }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = departmentId ? { departmentId } : {};
        const data = await getDashboardData(params);
        
        // Ensure we have valid data structure
        const validatedData = {
          statusBreakdown: data?.statusBreakdown || {
            pending: 0,
            inProgress: 0,
            review: 0,
            completed: 0,
            cancelled: 0
          },
          priorityBreakdown: data?.priorityBreakdown || {
            low: 0,
            medium: 0,
            high: 0,
            urgent: 0
          },
          overdueTasks: data?.overdueTasks || 0,
          tasksDueToday: data?.tasksDueToday || 0,
          avgProgress: data?.avgProgress || 0,
          totalTasks: data?.totalTasks || 0,
          activeTasks: data?.activeTasks || 0
        };
        
        setDashboardData(validatedData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        
        // Set fallback data even on error
        setDashboardData({
          statusBreakdown: { pending: 0, inProgress: 0, review: 0, completed: 0, cancelled: 0 },
          priorityBreakdown: { low: 0, medium: 0, high: 0, urgent: 0 },
          overdueTasks: 0,
          tasksDueToday: 0,
          avgProgress: 0,
          totalTasks: 0,
          activeTasks: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [departmentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const handleRetry = async () => {
    setError(null);
    setLoading(true);
    try {
      const params = departmentId ? { departmentId } : {};
      const data = await getDashboardData(params);
      setDashboardData(data);
    } catch (err) {
      console.error('Error retrying dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (error && !dashboardData) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex justify-between items-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={handleRetry}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { 
    statusBreakdown = {}, 
    priorityBreakdown = {}, 
    overdueTasks = 0, 
    tasksDueToday = 0, 
    avgProgress = 0, 
    totalTasks = 0, 
    activeTasks = 0 
  } = dashboardData || {};

  // Calculate percentages for status breakdown with safety checks
  const statusPercentages = {
    pending: totalTasks > 0 ? ((statusBreakdown.pending || 0) / totalTasks) * 100 : 0,
    inProgress: totalTasks > 0 ? ((statusBreakdown.inProgress || 0) / totalTasks) * 100 : 0,
    review: totalTasks > 0 ? ((statusBreakdown.review || 0) / totalTasks) * 100 : 0,
    completed: totalTasks > 0 ? ((statusBreakdown.completed || 0) / totalTasks) * 100 : 0,
    cancelled: totalTasks > 0 ? ((statusBreakdown.cancelled || 0) / totalTasks) * 100 : 0
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalTasks}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Active Tasks</h3>
          <p className="text-3xl font-bold text-blue-600 mt-1">{activeTasks}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Overdue Tasks</h3>
          <p className="text-3xl font-bold text-red-600 mt-1">{overdueTasks}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Due Today</h3>
          <p className="text-3xl font-bold text-amber-500 mt-1">{tasksDueToday}</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Task Status</h3>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500" 
            style={{ 
              width: `${statusPercentages.completed}%`,
              float: 'left'
            }}
            title={`Completed: ${statusBreakdown.completed} (${statusPercentages.completed.toFixed(1)}%)`}
          ></div>
          <div 
            className="h-full bg-yellow-500" 
            style={{ 
              width: `${statusPercentages.review}%`,
              float: 'left'
            }}
            title={`Review: ${statusBreakdown.review} (${statusPercentages.review.toFixed(1)}%)`}
          ></div>
          <div 
            className="h-full bg-blue-500" 
            style={{ 
              width: `${statusPercentages.inProgress}%`,
              float: 'left'
            }}
            title={`In Progress: ${statusBreakdown.inProgress} (${statusPercentages.inProgress.toFixed(1)}%)`}
          ></div>
          <div 
            className="h-full bg-gray-400" 
            style={{ 
              width: `${statusPercentages.pending}%`,
              float: 'left'
            }}
            title={`Pending: ${statusBreakdown.pending} (${statusPercentages.pending.toFixed(1)}%)`}
          ></div>
          <div 
            className="h-full bg-red-300" 
            style={{ 
              width: `${statusPercentages.cancelled}%`,
              float: 'left'
            }}
            title={`Cancelled: ${statusBreakdown.cancelled} (${statusPercentages.cancelled.toFixed(1)}%)`}
          ></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
            <span>Pending: {statusBreakdown.pending || 0}</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            <span>In Progress: {statusBreakdown.inProgress || 0}</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
            <span>Review: {statusBreakdown.review || 0}</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            <span>Completed: {statusBreakdown.completed || 0}</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-red-300 rounded-full mr-2"></span>
            <span>Cancelled: {statusBreakdown.cancelled || 0}</span>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Task Priority</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-500">Low</h4>
              <span className="text-sm font-medium text-gray-900">{priorityBreakdown.low || 0}</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-400" 
                style={{ width: `${totalTasks > 0 ? ((priorityBreakdown.low || 0) / totalTasks) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-500">Medium</h4>
              <span className="text-sm font-medium text-gray-900">{priorityBreakdown.medium || 0}</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-400" 
                style={{ width: `${totalTasks > 0 ? ((priorityBreakdown.medium || 0) / totalTasks) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-500">High</h4>
              <span className="text-sm font-medium text-gray-900">{priorityBreakdown.high || 0}</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-400" 
                style={{ width: `${totalTasks > 0 ? ((priorityBreakdown.high || 0) / totalTasks) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-500">Urgent</h4>
              <span className="text-sm font-medium text-gray-900">{priorityBreakdown.urgent || 0}</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500" 
                style={{ width: `${totalTasks > 0 ? ((priorityBreakdown.urgent || 0) / totalTasks) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Average Task Progress</h3>
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-4 mr-4">
            <div 
              className="bg-blue-600 h-4 rounded-full" 
              style={{ width: `${avgProgress}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{avgProgress.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;