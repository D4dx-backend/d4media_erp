import React, { useState, useEffect } from 'react';
import { getClientReport, exportReportPDF, exportReportCSV } from '../../services/reportService';
import { getUsers } from '../../services/userService';
import LoadingSpinner from '../common/LoadingSpinner';

const ClientReport = ({ departments = [] }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  
  // Default to last 30 days
  const getDefaultDates = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const [filters, setFilters] = useState({
    clientId: '',
    ...getDefaultDates(),
    department: ''
  });

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true);
        const response = await getUsers({ role: 'client' });
        if (response.success && response.data) {
          setClients(response.data);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
      } finally {
        setClientsLoading(false);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      if (!filters.clientId) {
        setReportData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getClientReport(filters);
        setReportData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching client report:', err);
        setError('Failed to load client report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleExport = (format) => {
    if (format === 'pdf') {
      exportReportPDF('client', filters);
    } else if (format === 'csv') {
      exportReportCSV('client', filters);
    }
  };

  if (clientsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Client Report Filters</h3>
          {reportData && (
            <div className="flex space-x-2 mt-2 sm:mt-0">
              <button
                onClick={() => handleExport('pdf')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Export PDF
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Export CSV
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
              Select Client *
            </label>
            <select
              id="clientId"
              name="clientId"
              value={filters.clientId}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.name} - {client.email}
                  {client.company && ` (${client.company})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              id="department"
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      {!filters.clientId ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-center">Please select a client to view their report.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-500">{error}</p>
        </div>
      ) : reportData ? (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Client Report: {reportData.client?.name || 'Unknown Client'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {reportData.client?.company && `${reportData.client.company} • `}
              {new Date(reportData.startDate).toLocaleDateString()} - {new Date(reportData.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="p-6">
            {/* Project Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500">Total Projects</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.statistics.total}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">{reportData.statistics.completionRate.toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500">Avg Progress</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">{reportData.statistics.avgProgress.toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-500">Overdue Tasks</h3>
                <p className="text-2xl font-bold text-red-600 mt-1">{reportData.statistics.overdueTasks}</p>
              </div>
            </div>

            {/* Hours Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-blue-700">Estimated Hours</h3>
                <p className="text-2xl font-bold text-blue-800 mt-1">{reportData.statistics.totalEstimatedHours.toFixed(1)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-green-700">Actual Hours</h3>
                <p className="text-2xl font-bold text-green-800 mt-1">{reportData.statistics.totalActualHours.toFixed(1)}</p>
              </div>
            </div>

            {/* Department Breakdown */}
            {reportData.statistics.departmentBreakdown && Object.keys(reportData.statistics.departmentBreakdown).length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Department Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(reportData.statistics.departmentBreakdown).map(([dept, count]) => (
                    <div key={dept} className="bg-gray-50 p-3 rounded-md text-center">
                      <span className="text-sm text-gray-500">{dept}</span>
                      <p className="text-xl font-bold text-gray-600">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Breakdown */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">Project Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <span className="text-sm text-gray-500">Pending</span>
                  <p className="text-xl font-bold text-gray-600">{reportData.statistics.byStatus.pending}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-md text-center">
                  <span className="text-sm text-blue-500">In Progress</span>
                  <p className="text-xl font-bold text-blue-600">{reportData.statistics.byStatus.inProgress}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-md text-center">
                  <span className="text-sm text-yellow-500">Review</span>
                  <p className="text-xl font-bold text-yellow-600">{reportData.statistics.byStatus.review}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-md text-center">
                  <span className="text-sm text-green-500">Completed</span>
                  <p className="text-xl font-bold text-green-600">{reportData.statistics.byStatus.completed}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-md text-center">
                  <span className="text-sm text-red-500">Cancelled</span>
                  <p className="text-xl font-bold text-red-600">{reportData.statistics.byStatus.cancelled}</p>
                </div>
              </div>
            </div>

            {/* Priority Breakdown */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">Project Priority</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <span className="text-sm text-gray-500">Low</span>
                  <p className="text-xl font-bold text-gray-600">{reportData.statistics.byPriority.low}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-md text-center">
                  <span className="text-sm text-blue-500">Medium</span>
                  <p className="text-xl font-bold text-blue-600">{reportData.statistics.byPriority.medium}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-md text-center">
                  <span className="text-sm text-orange-500">High</span>
                  <p className="text-xl font-bold text-orange-600">{reportData.statistics.byPriority.high}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-md text-center">
                  <span className="text-sm text-red-500">Urgent</span>
                  <p className="text-xl font-bold text-red-600">{reportData.statistics.byPriority.urgent}</p>
                </div>
              </div>
            </div>

            {/* Projects List */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Projects ({reportData.tasks.length})</h3>
              {reportData.tasks.length > 0 ? (
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
                          Assigned To
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.tasks.map(task => (
                        <tr key={task._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {task.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.department?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.assignedTo?.name || 'Unassigned'}
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
                            {new Date(task.dueDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No projects found for this client in the selected period.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ClientReport;