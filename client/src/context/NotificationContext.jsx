import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState({
    limit: 20,
    skip: 0,
    total: 0
  });

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      const socket = notificationService.initializeSocket(user._id);
      
      // Listen for new notifications
      socket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification for high priority notifications
        if (notification.priority === 'high' || notification.priority === 'urgent') {
          toast.info(
            <div>
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
            </div>,
            {
              autoClose: notification.priority === 'urgent' ? false : 5000,
              onClick: () => handleNotificationClick(notification)
            }
          );
        }
      });
      
      // Listen for unread count updates
      socket.on('unread_count', (count) => {
        setUnreadCount(count);
      });
      
      // Clean up socket connection on unmount
      return () => {
        notificationService.disconnectSocket();
      };
    }
  }, [isAuthenticated, user]);
  
  // Load initial notifications and unread count
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isAuthenticated]);
  
  // Fetch notifications
  const fetchNotifications = async (reset = true) => {
    try {
      setLoading(true);
      const params = {
        limit: pagination.limit,
        skip: reset ? 0 : pagination.skip
      };
      
      const response = await notificationService.getUserNotifications(params);
      
      if (reset) {
        setNotifications(response.data);
      } else {
        setNotifications(prev => [...prev, ...response.data]);
      }
      
      setPagination(response.pagination);
      setHasMore(response.pagination.hasMore);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch more notifications (pagination)
  const fetchMoreNotifications = async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      const newSkip = pagination.skip + pagination.limit;
      
      const response = await notificationService.getUserNotifications({
        limit: pagination.limit,
        skip: newSkip
      });
      
      setNotifications(prev => [...prev, ...response.data]);
      setPagination({
        ...response.pagination,
        skip: newSkip
      });
      setHasMore(response.pagination.hasMore);
    } catch (error) {
      console.error('Error fetching more notifications:', error);
      toast.error('Failed to load more notifications');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Update unread count
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };
  
  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      const deletedNotification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // Navigate based on notification type and related model
    if (notification.relatedModel === 'Task' && notification.relatedId) {
      navigate(`/tasks/${notification.relatedId}`);
    } else if (notification.relatedModel === 'StudioBooking' && notification.relatedId) {
      navigate(`/studio/bookings/${notification.relatedId}`);
    } else if (notification.relatedModel === 'Invoice' && notification.relatedId) {
      navigate(`/invoices/${notification.relatedId}`);
    }
  };
  
  // Update notification preferences
  const updatePreferences = async (preferences) => {
    try {
      const response = await notificationService.updateNotificationPreferences(preferences);
      toast.success('Notification preferences updated');
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Failed to update notification preferences');
      throw error;
    }
  };
  
  // Send system notification (admin only)
  const sendSystemNotification = async (notificationData) => {
    try {
      const response = await notificationService.sendSystemNotification(notificationData);
      toast.success(`Notification sent to ${response.count} users`);
      return response;
    } catch (error) {
      console.error('Error sending system notification:', error);
      toast.error('Failed to send system notification');
      throw error;
    }
  };
  
  const value = {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    fetchMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationClick,
    updatePreferences,
    sendSystemNotification
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;