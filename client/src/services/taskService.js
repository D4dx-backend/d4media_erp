import api from './authService';

const API_URL = '/tasks';

// Get all tasks with filtering
export const getTasks = async (params = {}) => {
  try {
    console.log('Fetching tasks with params:', params);
    const response = await api.get(API_URL, { params });
    console.log('Raw task API response:', response);
    
    // Ensure we always return a consistent format
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data;
    } else if (Array.isArray(response.data)) {
      return { success: true, data: response.data, count: response.data.length };
    } else if (response.data && typeof response.data === 'object') {
      return { 
        success: true, 
        data: response.data.tasks || response.data.data || [], 
        count: response.data.count || 0 
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { success: false, data: [], error: error.response?.data?.message || 'Failed to fetch tasks' };
  }
};

// Get single task item
export const getTaskById = async (taskId) => {
  try {
    const response = await api.get(`${API_URL}/${taskId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error);
    return { success: false, error: error.response?.data?.message || 'Failed to fetch task' };
  }
};

// Get completed billable tasks for a client
export const getBillableTasks = async (clientId) => {
  try {
    const response = await api.get(`${API_URL}/billable`, { 
      params: { 
        client: clientId,
        status: 'completed',
        billable: true,
        invoiced: false
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching billable tasks:', error);
    return { success: false, data: [], error: error.response?.data?.message || 'Failed to fetch billable tasks' };
  }
};

export default {
  getTasks,
  getTaskById,
  getBillableTasks
};