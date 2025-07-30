import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../context/NotificationContext';
import { 
  BellIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const NotificationItem = ({ notification }) => {
  const { markAsRead, deleteNotification, handleNotificationClick } = useNotifications();
  
  // Format notification time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  };
  
  // Get icon based on notification type and priority
  const getIcon = () => {
    const iconClasses = `h-5 w-5 ${getPriorityColor()}`;
    
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
  const getPriorityColor = () => {
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
  
  // Handle click on notification
  const onClick = () => {
    handleNotificationClick(notification);
  };
  
  // Handle mark as read
  const onMarkAsRead = (e) => {
    e.stopPropagation();
    markAsRead(notification._id);
  };
  
  // Handle delete
  const onDelete = (e) => {
    e.stopPropagation();
    deleteNotification(notification._id);
  };
  
  return (
    <li 
      className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
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
        <div className="flex-shrink-0 ml-2 flex flex-col space-y-2">
          {!notification.read && (
            <button
              onClick={onMarkAsRead}
              className="text-blue-500 hover:text-blue-700"
              title="Mark as read"
            >
              <CheckCircleIcon className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-500"
            title="Delete notification"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </li>
  );
};

export default NotificationItem;