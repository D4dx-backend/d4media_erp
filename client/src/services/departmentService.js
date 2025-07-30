import api from './authService'

// Direct export for getDepartments function
export const getDepartments = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/departments?${queryString}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch departments')
  }
}

export const departmentService = {
  // Get all departments
  getDepartments: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString()
      const response = await api.get(`/departments?${queryString}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch departments')
    }
  },

  // Get single department by ID
  getDepartment: async (id) => {
    try {
      const response = await api.get(`/departments/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch department')
    }
  },

  // Create new department
  createDepartment: async (departmentData) => {
    try {
      console.log('Creating department with data:', JSON.stringify(departmentData));
      const response = await api.post('/departments', departmentData);
      return response.data;
    } catch (error) {
      console.error('Department creation error:', error.response?.data || error);
      
      // Check for duplicate key error (MongoDB error code 11000)
      if (error.response?.data?.error?.includes('Duplicate field value')) {
        throw new Error('A department with this name or code already exists');
      }
      
      // Check for validation errors
      if (error.response?.data?.details) {
        const validationErrors = error.response.data.details
          .map(detail => `${detail.path}: ${detail.msg}`)
          .join(', ');
        throw new Error(`Validation failed: ${validationErrors}`);
      }
      
      // Pass through the original error if it has response data
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      throw new Error('Failed to create department. Please try again.');
    }
  },

  // Update department
  updateDepartment: async (id, departmentData) => {
    try {
      const response = await api.put(`/departments/${id}`, departmentData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update department')
    }
  },

  // Delete department
  deleteDepartment: async (id) => {
    try {
      const response = await api.delete(`/departments/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete department')
    }
  },

  // Toggle department status
  toggleDepartmentStatus: async (id, isActive) => {
    try {
      const response = await api.patch(`/departments/${id}/status`, { isActive })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update department status')
    }
  }
}

export default departmentService