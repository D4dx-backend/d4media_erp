import api from './authService';
import { io } from 'socket.io-client';
import { getAuthToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

// Initialize socket connection
export const initializeSocket = (userId) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket'],
    auth: {
      token: getAuthToken()
    }
  });

  socket.on('connect', () => {
    console.log('Connected to notification socket');
    socket.emit('authenticate', userId);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Get socket instance
export const getSocket = () => socket;

// Get user notifications
export const getUserNotifications = async (params = {}) => {
  const { limit = 20, skip = 0, unreadOnly = false } = params;
  const response = await api.get(`/notifications`, {
    params: { limit, skip, unreadOnly }
  });
  return response.data;
};

// Get unread notifications count
export const getUnreadCount = async () => {
  const response = await api.get(`/notifications/unread-count`);
  return response.data.count;
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`, {});
  return response.data;
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  const response = await api.put(`/notifications/read-all`, {});
  return response.data;
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};

// Update notification preferences
export const updateNotificationPreferences = async (preferences) => {
  const response = await api.put(`/notifications/preferences`, preferences);
  return response.data;
};

// Send system notification (admin only)
export const sendSystemNotification = async (notificationData) => {
  const response = await api.post(`/notifications/system`, notificationData);
  return response.data;
};

export default {
  initializeSocket,
  disconnectSocket,
  getSocket,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updateNotificationPreferences,
  sendSystemNotification
};