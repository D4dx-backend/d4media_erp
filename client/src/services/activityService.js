import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Activity Service
export const activityService = {
  // Get user activities
  getUserActivities: async (userId = null, params = {}) => {
    const url = userId ? `/activities/user/${userId}` : '/activities/user';
    const response = await api.get(url, { params });
    return response.data;
  },

  // Get system activities (Admin only)
  getSystemActivities: async (params = {}) => {
    const response = await api.get('/activities/system', { params });
    return response.data;
  },

  // Get activity statistics
  getActivityStats: async (params = {}) => {
    const response = await api.get('/activities/stats', { params });
    return response.data;
  },

  // Get login history (Admin only)
  getLoginHistory: async (params = {}) => {
    const response = await api.get('/activities/login-history', { params });
    return response.data;
  },

  // Get document audit trail
  getDocumentAuditTrail: async (documentType, documentId) => {
    const response = await api.get(`/activities/audit/${documentType}/${documentId}`);
    return response.data;
  },

  // Get user audit activities
  getUserAuditActivities: async (userId = null, params = {}) => {
    const url = userId ? `/activities/audit/user/${userId}` : '/activities/audit/user';
    const response = await api.get(url, { params });
    return response.data;
  },

  // Get audit statistics
  getAuditStats: async (params = {}) => {
    const response = await api.get('/activities/audit/stats', { params });
    return response.data;
  }
};

export default activityService;