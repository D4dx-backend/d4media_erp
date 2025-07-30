import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { getBookings } from '../../services/studioService';
import { getEvents } from '../../services/eventService';
import { getDashboardData } from '../../services/reportService';
import LoadingSpinner from '../common/LoadingSpinner';

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    todayBookings: [],
    tomorrowBookings: [],
    todayEvents: [],
    tomorrowEvents: [],
    stats: {},
    urgentTasks: [],
    recentActivities: []
  });

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  const fetchDashboardOverview = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Fetch all data in parallel
      const [
        todayBookingsRes,
        tomorrowBookingsRes,
        todayEventsRes,
        tomorrowEventsRes,
        dashboardStats
      ] = await Promise.all([
        getBookings({ date: todayStr, type: 'studio' }),
        getBookings({ date: tomorrowStr, type: 'studio' }),
        getEvents({ date: todayStr }),
        getEvents({ date: tomorrowStr }),
        getDashboardData({ includeSummary: true })
      ]);

      setData({
        todayBookings: todayBookingsRes?.data || [],
        tomorrowBookings: tomorrowBookingsRes?.data || [],
        todayEvents: todayEventsRes?.data || [],
        tomorrowEvents: tomorrowEventsRes?.data || [],
        stats: dashboardStats || {},
        urgentTasks: dashboardStats?.urgentTasks || [],
        recentActivities: dashboardStats?.recentActivities || []
      });
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
              <p className="text-xl font-bold text-gray-900">{data.todayBookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Today's Events</p>
              <p className="text-xl font-bold text-gray-900">{data.todayEvents.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Urgent Tasks</p>
              <p className="text-xl font-bold text-gray-900">{data.urgentTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(data.stats.todayStats?.revenue || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Studio Bookings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MapPin className="h-5 w-5 text-blue-500 mr-2" />
              Today's Studio Bookings
            </h3>
          </div>
          <div className="p-6">
            {data.todayBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No studio bookings today</p>
            ) : (
              <div className="space-y-4">
                {data.todayBookings.map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{booking.clientName}</p>
                      <p className="text-sm text-gray-600">{booking.title}</p>
                      <p className="text-xs text-gray-500">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Today's Events */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 text-purple-500 mr-2" />
              Today's Events
            </h3>
          </div>
          <div className="p-6">
            {data.todayEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No events today</p>
            ) : (
              <div className="space-y-4">
                {data.todayEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.eventType}</p>
                      <p className="text-xs text-gray-500">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tomorrow's Preview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 text-green-500 mr-2" />
            Tomorrow's Schedule Preview
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tomorrow's Bookings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Studio Bookings ({data.tomorrowBookings.length})</h4>
              {data.tomorrowBookings.length === 0 ? (
                <p className="text-gray-500 text-sm">No bookings scheduled</p>
              ) : (
                <div className="space-y-2">
                  {data.tomorrowBookings.slice(0, 3).map((booking, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-900">{booking.clientName}</span>
                      <span className="text-gray-500">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </span>
                    </div>
                  ))}
                  {data.tomorrowBookings.length > 3 && (
                    <p className="text-xs text-gray-500">+{data.tomorrowBookings.length - 3} more</p>
                  )}
                </div>
              )}
            </div>

            {/* Tomorrow's Events */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Events ({data.tomorrowEvents.length})</h4>
              {data.tomorrowEvents.length === 0 ? (
                <p className="text-gray-500 text-sm">No events scheduled</p>
              ) : (
                <div className="space-y-2">
                  {data.tomorrowEvents.slice(0, 3).map((event, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-900">{event.title}</span>
                      <span className="text-gray-500">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </span>
                    </div>
                  ))}
                  {data.tomorrowEvents.length > 3 && (
                    <p className="text-xs text-gray-500">+{data.tomorrowEvents.length - 3} more</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">New Studio Booking</span>
              </button>
              
              <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Users className="h-4 w-4 text-purple-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">New Event Booking</span>
              </button>
              
              <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Create Task</span>
              </button>
              
              <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <DollarSign className="h-4 w-4 text-emerald-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Generate Invoice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 text-orange-500 mr-2" />
              Recent Activities
            </h3>
          </div>
          <div className="p-6">
            {data.recentActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activities</p>
            ) : (
              <div className="space-y-3">
                {data.recentActivities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;