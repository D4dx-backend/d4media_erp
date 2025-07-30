import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClientDashboard } from '../../services/clientPortalService';
import LoadingSpinner from '../common/LoadingSpinner';

const ClientDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getClientDashboard();
        setDashboardData(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  if (!dashboardData) {
    return null;
  }

  const { 
    activeTasks, 
    completedTasks, 
    upcomingBookings, 
    recentInvoices,
    taskStats,
    invoiceStats
  } = dashboardData;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Client Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Tasks" 
          value={taskStats.active} 
          total={taskStats.total}
          color="blue"
          icon="📋"
        />
        <StatCard 
          title="Completed Tasks" 
          value={taskStats.completed} 
          total={taskStats.total}
          color="green"
          icon="✅"
        />
        <StatCard 
          title="Overdue Tasks" 
          value={taskStats.overdue} 
          total={taskStats.total}
          color="red"
          icon="⚠️"
        />
        <StatCard 
          title="Pending Invoices" 
          value={invoiceStats.pending} 
          total={invoiceStats.total}
          color="yellow"
          icon="💰"
        />
      </div>

      {/* Active Tasks */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Active Tasks</h2>
          <Link to="/client/projects" className="text-blue-600 hover:underline text-sm">
            View All
          </Link>
        </div>
        
        {activeTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeTasks.map((task) => (
                  <tr key={task._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/client/tasks/${task._id}`} className="text-blue-600 hover:underline">
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.department?.name || 'N/A'}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 italic">No active tasks found.</p>
        )}
      </div>

      {/* Recently Completed Tasks */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recently Completed</h2>
          <Link to="/client/projects" className="text-blue-600 hover:underline text-sm">
            View All
          </Link>
        </div>
        
        {completedTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTasks.map((task) => (
              <div key={task._id} className="border border-gray-200 rounded-md p-4">
                <h3 className="font-medium mb-2">
                  <Link to={`/client/tasks/${task._id}`} className="text-blue-600 hover:underline">
                    {task.title}
                  </Link>
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  {task.department?.name || 'N/A'}
                </p>
                <p className="text-xs text-gray-400">
                  Completed: {task.completedDate ? new Date(task.completedDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No completed tasks found.</p>
        )}
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings && upcomingBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Studio Bookings</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBookings.map((booking) => (
              <div key={booking._id} className="border border-gray-200 rounded-md p-4">
                <h3 className="font-medium mb-2">
                  {booking.purpose || 'Studio Booking'}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(booking.bookingDate).toLocaleDateString()} | {booking.timeSlot?.startTime} - {booking.timeSlot?.endTime}
                </p>
                <p className="text-xs text-gray-400">
                  Status: <StatusBadge status={booking.status} />
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      {recentInvoices && recentInvoices.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Invoices</h2>
            <Link to="/client/invoices" className="text-blue-600 hover:underline text-sm">
              View All
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentInvoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/client/invoices/${invoice._id}`} className="text-blue-600 hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${invoice.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper components
const StatCard = ({ title, value, total, color, icon }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex items-end">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-gray-500 ml-2">/ {total}</span>
      </div>
      <div className="mt-2">
        <span className={`text-xs px-2 py-1 rounded-full ${colorClasses[color]}`}>
          {percentage}%
        </span>
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
    inquiry: { label: 'Inquiry', classes: 'bg-purple-100 text-purple-800' },
    confirmed: { label: 'Confirmed', classes: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'In Progress', classes: 'bg-blue-100 text-blue-800' },
  };

  const config = statusConfig[status] || { label: status, classes: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${config.classes}`}>
      {config.label}
    </span>
  );
};

const InvoiceStatusBadge = ({ status }) => {
  const statusConfig = {
    draft: { label: 'Draft', classes: 'bg-gray-100 text-gray-800' },
    sent: { label: 'Sent', classes: 'bg-blue-100 text-blue-800' },
    paid: { label: 'Paid', classes: 'bg-green-100 text-green-800' },
    overdue: { label: 'Overdue', classes: 'bg-red-100 text-red-800' },
    cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-800' },
  };

  const config = statusConfig[status] || { label: status, classes: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${config.classes}`}>
      {config.label}
    </span>
  );
};

export default ClientDashboard;