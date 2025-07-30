import React, { useState, useEffect } from 'react';
import { getWeeklyReport, exportReportPDF, exportReportCSV } from '../../services/reportService';
import ReportFilters from './ReportFilters';
import LoadingSpinner from '../common/LoadingSpinner';

const WeeklyReport = ({ departments = [] }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  
  // Default to current week
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const [filters, setFilters] = useState({
    ...getWeekDates(),
    department: ''
  });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await getWeeklyReport(filters);
        setReportData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching weekly report:', err);
        setError('Failed to load weekly report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleExport = (format, exportFilters) => {
    if (format === 'pdf') {
      exportReportPDF('weekly', exportFilters);
    } else if (format === 'csv') {
      exportReportCSV('weekly', exportFilters);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  const { statistics, tasks, startDate, endDate } = reportData;
  const formattedStartDate = new Date(startDate).toLocaleDateString();
  const formattedEndDate = new Date(endDate).toLocaleDateString();

  return (
    <div>
      <ReportFilters
        reportType="weekly"
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        departments={departments}
        initialFilters={filters}
      />

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Weekly Report: {formattedStartDate} - {formattedEndDate}
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.total}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Estimated Hours</h3>
              <p className="text-2xl font-bold text-blue-600 mt-1">{statistics.totalEstimatedHours.toFixed(1)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Actual Hours</h3>
              <p className="text-2xl font-bold text-green-600 mt-1">{statistics.totalActualHours.toFixed(1)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Completed Tasks</h3>
              <p className="text-2xl font-bold text-green-600 mt-1">{statistics.byStatus.completed}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">Status Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <span className="text-sm text-gray-500">Pending</span>
                <p className="text-xl font-bold text-gray-600">{statistics.byStatus.pending}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-md text-center">
                <span className="text-sm text-blue-500">In Progress</span>
                <p className="text-xl font-bold text-blue-600">{statistics.byStatus.inProgress}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-md text-center">
                <span className="text-sm text-yellow-500">Review</span>
                <p className="text-xl font-bold text-yellow-600">{statistics.byStatus.review}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-md text-center">
                <span className="text-sm text-green-500">Completed</span>
                <p className="text-xl font-bold text-green-600">{statistics.byStatus.completed}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-md text-center">
                <span className="text-sm text-red-500">Cancelled</span>
                <p className="text-xl font-bold text-red-600">{statistics.byStatus.cancelled}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">Priority Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <span className="text-sm text-gray-500">Low</span>
                <p className="text-xl font-bold text-gray-600">{statistics.byPriority.low}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-md text-center">
                <span className="text-sm text-blue-500">Medium</span>
                <p className="text-xl font-bold text-blue-600">{statistics.byPriority.medium}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-md text-center">
                <span className="text-sm text-orange-500">High</span>
                <p className="text-xl font-bold text-orange-600">{statistics.byPriority.high}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-md text-center">
                <span className="text-sm text-red-500">Urgent</span>
                <p className="text-xl font-bold text-red-600">{statistics.byPriority.urgent}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Tasks ({tasks.length})</h3>
            {tasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map(task => (
                      <tr key={task._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {task.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.department?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                              task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${task.priority === 'urgent' ? 'bg-red-100 text-red-800' : 
                              task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              task.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.assignedTo?.name || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No tasks found for this week.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReport;