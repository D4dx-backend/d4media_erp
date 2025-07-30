import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// Log API configuration
console.log('API Configuration:', {
  baseURL: API_URL,
  environment: import.meta.env.MODE
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('Adding auth token to request:', config.url)
    } else {
      console.warn('No auth token found for request:', config.url)
    }
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// Helper functions for auth headers and tokens
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      console.log('Attempting login with credentials:', { email: credentials.email });
      const response = await api.post('/auth/login', credentials)
      console.log('Login response:', response.data);
      return response.data
    } catch (error) {
      console.error('Login error:', error);
      console.error('Login error response:', error.response?.data);
      
      // Handle different types of errors
      if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
        throw new Error('Network error. Please check your internet connection.')
      }
      
      if (error.message && error.message.includes('CORS')) {
        throw new Error('CORS error. The server may not be configured to accept requests from this domain.')
      }
      
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password. Please try again.')
      }
      
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error || error.response?.data?.message
        if (errorMsg.includes('validation')) {
          throw new Error('Please check your email and password format.')
        }
        throw new Error(errorMsg || 'Invalid request. Please check your input.')
      }
      
      if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.')
      }
      
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Login failed. Please try again.')
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Registration failed')
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      console.log('Getting current user profile...');
      const response = await api.get('/users/profile')
      console.log('Current user response:', response.data);
      return response.data.user
    } catch (error) {
      console.error('Get current user error:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to get user')
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh')
      return response.data
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Token refresh failed')
    }
  }
}

export default api;