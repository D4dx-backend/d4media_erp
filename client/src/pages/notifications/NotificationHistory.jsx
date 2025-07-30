import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SystemNotificationForm from '../../components/notifications/SystemNotificationForm';
import { 
  BellIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const NotificationHistory = () => {
  const {
    notifications,
    loading,
    hasMore,
    unreadCount,
    fetchNotifications,
    fetchMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationClick
  } = useNotifications();
  const { user } = useAuth();
  
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [showSystemForm, setShowSystemForm] = useState(false);
  
  // Check if user has admin privileges
  const isAdmin = user && (user.role === 'super_admin' || user.role === 'department_admin');
  
  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  // Handle scroll to implement infinite loading
  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >= 
      document.documentElement.offsetHeight - 100
    ) {
      if (!loading && hasMore) {
        fetchMoreNotifications();
      }
    }
  };
  
  // Add scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loading, hasMore]);
  
  // Format notification time
  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
  };
  
  // Get icon based on notification type and priority
  const getIcon = (notification) => {
    const iconClasses = `h-5 w-5 ${getPriorityColor(notification)}`;
    
    switch (notification.type) {
      case 'task_assignment':
        return <CheckCircleIcon className={iconClasses} />;
      case 'deadline_reminder':
        return <ClockIcon className={iconClasses} />;
      case 'overdue_task':
        return <ExclamationCircleIcon className={iconClasses} />;
      default:
        return <BellIcon className={iconClasses} />;
    }
  };
  
  // Get color based on notification priority
  const getPriorityColor = (notification) => {
    switch (notification.priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-gray-600';
    }
  };
  
  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });
  
  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            View and manage your notification history
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
          {isAdmin && (
            <button
              onClick={() => setShowSystemForm(!showSystemForm)}
              className="inline-flex items-center px-4 py-2 border border-blue-500 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <BellIcon className="h-5 w-5 mr-2" />
              {showSystemForm ? 'Hide System Notification' : 'Send System Notification'}
            </button>
          )}
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CheckIcon className="h-5 w-5 mr-2 text-gray-500" />
              Mark All as Read
            </button>
          )}
        </div>
      </div>
      
      {isAdmin && showSystemForm && (
        <div className="mb-6">
          <SystemNotificationForm />
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'unread' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'read' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setFilter('read')}
            >
              Read
            </button>
          </div>
        </div>
        
        {filteredNotifications.length === 0 && !loading ? (
          <div className="p-8 text-center text-gray-500">
            <BellIcon className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2 text-lg font-medium">No notifications</p>
            <p className="mt-1">
              {filter === 'all' 
                ? "You don't have any notifications yet." 
                : filter === 'unread' 
                  ? "You don't have any unread notifications." 
                  : "You don't have any read notifications."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <li 
                key={notification._id}
                className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {getIcon(notification)}
                  </div>
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <p className={`text-sm font-medium ${!notification.read ? 'text-blue-800' : 'text-gray-900'}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-2 flex space-x-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Mark as read"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="text-gray-400 hover:text-red-500"
                      title="Delete notification"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {loading && (
          <div className="p-4 flex justify-center">
            <LoadingSpinner size="medium" />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationHistory;