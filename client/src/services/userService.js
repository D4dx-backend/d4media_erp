import api from './authService'

// Direct export for getUsers function
export const getUsers = async (params = {}) => {
  try {
    // Clean up params - remove empty strings
    const cleanParams = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });
    
    const queryString = new URLSearchParams(cleanParams).toString();
    const response = await api.get(`/users?${queryString}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    if (error.response?.data?.details) {
      const validationErrors = error.response.data.details
        .map(detail => `${detail.path}: ${detail.msg}`)
        .join(', ');
      throw new Error(`Validation failed: ${validationErrors}`);
    }
    return { data: [] }; // Return empty data instead of throwing
  }
}

export const userService = {
  // Get all users with pagination and filtering
  getUsers: async (params = {}) => {
    try {
      // Clean up params - remove empty strings
      const cleanParams = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = value;
        }
      });
      
      const queryString = new URLSearchParams(cleanParams).toString();
      console.log('User service getUsers query:', queryString);
      const response = await api.get(`/users?${queryString}`);
      console.log('User service getUsers response:', response.data);
      return response.data;
    } catch (error) {
      console.error('User service getUsers error:', error);
      if (error.response?.data?.details) {
        const validationErrors = error.response.data.details
          .map(detail => `${detail.path}: ${detail.msg}`)
          .join(', ');
        throw new Error(`Validation failed: ${validationErrors}`);
      }
      return { data: [] }; // Return empty data instead of throwing
    }
  },

  // Get single user by ID
  getUser: async (id) => {
    try {
      const response = await api.get(`/users/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return { success: false, error: error.response?.data?.error || 'Failed to fetch user' };
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await api.post('/users', userData)
      return response.data
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to create user' };
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData)
      return response.data
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      return { success: false, error: error.response?.data?.error || 'Failed to update user' };
    }
  },

  // Delete user (deactivate)
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      return { success: false, error: error.response?.data?.error || 'Failed to delete user' };
    }
  },

  // Toggle user status (activate/deactivate)
  toggleUserStatus: async (id, isActive) => {
    try {
      const response = await api.patch(`/users/${id}/status`, { isActive })
      return response.data
    } catch (error) {
      console.error(`Error toggling user status for ${id}:`, error);
      return { success: false, error: error.response?.data?.error || 'Failed to update user status' };
    }
  },

  // Get users by department
  getDepartmentUsers: async (departmentId, params = {}) => {
    try {
      // Clean up params - remove empty strings
      const cleanParams = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = value;
        }
      });
      
      const queryString = new URLSearchParams(cleanParams).toString();
      const response = await api.get(`/users/department/${departmentId}?${queryString}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching department users for ${departmentId}:`, error);
      if (error.response?.data?.details) {
        const validationErrors = error.response.data.details
          .map(detail => `${detail.path}: ${detail.msg}`)
          .join(', ');
        console.error('Validation errors:', validationErrors);
      }
      return { data: [] }; // Return empty data instead of throwing
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile')
      return response.data
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to fetch profile' };
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData)
      return response.data
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to update profile' };
    }
  },

  // Update password
  updatePassword: async (passwordData) => {
    try {
      const response = await api.put('/users/profile/password', passwordData)
      return response.data
    } catch (error) {
      console.error('Error updating password:', error);
      throw new Error(error.response?.data?.error || 'Failed to update password');
    }
  },

  // Reset user password (Super Admin only)
  resetUserPassword: async (userId, newPassword) => {
    try {
      const response = await api.put(`/users/${userId}/reset-password`, { newPassword })
      return response.data
    } catch (error) {
      console.error(`Error resetting password for user ${userId}:`, error);
      throw new Error(error.response?.data?.error || 'Failed to reset user password');
    }
  },

  // Test WhatsApp service (Super Admin only)
  testWhatsApp: async (phoneNumber) => {
    try {
      const response = await api.post('/users/test-whatsapp', { phoneNumber })
      return response.data
    } catch (error) {
      console.error('Error testing WhatsApp service:', error);
      throw new Error(error.response?.data?.error || 'Failed to test WhatsApp service');
    }
  }
}

export default userService