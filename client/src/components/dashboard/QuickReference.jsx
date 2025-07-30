import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { getBookings } from '../../services/studioService';
import { getEvents } from '../../services/eventService';
import { getDashboardData } from '../../services/reportService';
import LoadingSpinner from '../common/LoadingSpinner';
import UpcomingDeadlines from './UpcomingDeadlines';

const QuickReference = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    todayBookings: [],
    tomorrowBookings: [],
    todayEvents: [],
    tomorrowEvents: [],
    urgentTasks: [],
    recentActivities: []
  });

  useEffect(() => {
    fetchQuickReferenceData();
  }, []);

  const fetchQuickReferenceData = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Fetch studio bookings for today and tomorrow
      const [todayBookingsRes, tomorrowBookingsRes] = await Promise.all([
        getBookings({ date: todayStr, type: 'studio' }),
        getBookings({ date: tomorrowStr, type: 'studio' })
      ]);

      // Fetch events for today and tomorrow
      const [todayEventsRes, tomorrowEventsRes] = await Promise.all([
        getEvents({ date: todayStr }),
        getEvents({ date: tomorrowStr })
      ]);

      // Fetch dashboard data for urgent tasks
      const dashboardData = await getDashboardData();

      setData({
        todayBookings: todayBookingsRes?.data || [],
        tomorrowBookings: tomorrowBookingsRes?.data || [],
        todayEvents: todayEventsRes?.data || [],
        tomorrowEvents: tomorrowEventsRes?.data || [],
        urgentTasks: dashboardData?.urgentTasks || [],
        recentActivities: dashboardData?.recentActivities || []
      });
    } catch (error) {
      console.error('Error fetching quick reference data:', error);
      // Set fallback data
      setData({
        todayBookings: [],
        tomorrowBookings: [],
        todayEvents: [],
        tomorrowEvents: [],
        urgentTasks: [],
        recentActivities: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
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

  return (
    <div className="space-y-6">
      {/* Upcoming Deadlines - Full Width */}
      <UpcomingDeadlines />
      
      {/* Quick Reference Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Today's Studio Bookings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <MapPin className="h-5 w-5 text-blue-500 mr-2" />
            Today's Studio Bookings
          </h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {data.todayBookings.length}
          </span>
        </div>
        
        {data.todayBookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No studio bookings today</p>
        ) : (
          <div className="space-y-3">
            {data.todayBookings.slice(0, 3).map((booking, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-3 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {booking.clientName || booking.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    booking.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
            {data.todayBookings.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{data.todayBookings.length - 3} more bookings
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tomorrow's Studio Bookings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 text-green-500 mr-2" />
            Tomorrow's Studio Bookings
          </h3>
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {data.tomorrowBookings.length}
          </span>
        </div>
        
        {data.tomorrowBookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No studio bookings tomorrow</p>
        ) : (
          <div className="space-y-3">
            {data.tomorrowBookings.slice(0, 3).map((booking, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-3 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {booking.clientName || booking.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    booking.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
            {data.tomorrowBookings.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{data.tomorrowBookings.length - 3} more bookings
              </p>
            )}
          </div>
        )}
      </div>

      {/* Today's Events */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Users className="h-5 w-5 text-purple-500 mr-2" />
            Today's Events
          </h3>
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {data.todayEvents.length}
          </span>
        </div>
        
        {data.todayEvents.length === 0 ? (
          <p className="text-gray-500 text-sm">No events today</p>
        ) : (
          <div className="space-y-3">
            {data.todayEvents.slice(0, 3).map((event, index) => (
              <div key={index} className="border-l-4 border-purple-500 pl-3 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {event.title || event.eventType}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    event.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
            {data.todayEvents.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{data.todayEvents.length - 3} more events
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tomorrow's Events */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
            Tomorrow's Events
          </h3>
          <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {data.tomorrowEvents.length}
          </span>
        </div>
        
        {data.tomorrowEvents.length === 0 ? (
          <p className="text-gray-500 text-sm">No events tomorrow</p>
        ) : (
          <div className="space-y-3">
            {data.tomorrowEvents.slice(0, 3).map((event, index) => (
              <div key={index} className="border-l-4 border-indigo-500 pl-3 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {event.title || event.eventType}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    event.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
            {data.tomorrowEvents.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{data.tomorrowEvents.length - 3} more events
              </p>
            )}
          </div>
        )}
      </div>

      {/* Urgent Tasks */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            Urgent Tasks
          </h3>
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {data.urgentTasks.length}
          </span>
        </div>
        
        {data.urgentTasks.length === 0 ? (
          <p className="text-gray-500 text-sm">No urgent tasks</p>
        ) : (
          <div className="space-y-3">
            {data.urgentTasks.slice(0, 3).map((task, index) => (
              <div key={index} className="border-l-4 border-red-500 pl-3 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                    Urgent
                  </span>
                </div>
              </div>
            ))}
            {data.urgentTasks.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{data.urgentTasks.length - 3} more urgent tasks
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 text-orange-500 mr-2" />
            Recent Activities
          </h3>
        </div>
        
        {data.recentActivities.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent activities</p>
        ) : (
          <div className="space-y-3">
            {data.recentActivities.slice(0, 4).map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {activity.description}
                  </p>
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
  );
};

export default QuickReference;