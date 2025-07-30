import api from './authService';

const API_URL = '/rentals';

// Get all rentals with filtering
export const getRentals = async (params = {}) => {
  try {
    const response = await api.get(API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching rentals:', error);
    return { success: false, data: [], error: error.response?.data?.message || 'Failed to fetch rentals' };
  }
};

// Get single rental
export const getRental = async (rentalId) => {
  try {
    const response = await api.get(`${API_URL}/${rentalId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching rental ${rentalId}:`, error);
    return { success: false, error: error.response?.data?.message || 'Failed to fetch rental' };
  }
};

// Create new rental
export const createRental = async (rentalData) => {
  try {
    console.log('Creating rental with data:', rentalData);
    const response = await api.post(API_URL, rentalData);
    console.log('Create rental response:', response);
    
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data) {
      return { success: true, data: response.data };
    } else {
      console.error('Unexpected response format:', response);
      return { 
        success: false, 
        error: 'Unexpected response format from server'
      };
    }
  } catch (error) {
    console.error('Error creating rental:', error);
    console.error('Error details:', error.response?.data);
    
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to create rental',
      errors: error.response?.data?.errors
    };
  }
};

// Update rental
export const updateRental = async (rentalId, rentalData) => {
  try {
    const response = await api.put(`${API_URL}/${rentalId}`, rentalData);
    return response.data;
  } catch (error) {
    console.error(`Error updating rental ${rentalId}:`, error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to update rental',
      errors: error.response?.data?.errors
    };
  }
};

// Return equipment
export const returnEquipment = async (rentalId, equipmentId, returnData) => {
  try {
    const response = await api.put(`${API_URL}/${rentalId}/return/${equipmentId}`, returnData);
    return response.data;
  } catch (error) {
    console.error(`Error returning equipment ${equipmentId}:`, error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to return equipment'
    };
  }
};

// Get available equipment for rental
export const getAvailableEquipment = async (startDate, endDate) => {
  try {
    console.log('Fetching available equipment with params:', { startDate, endDate });
    
    // Add a timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    const response = await api.get(`${API_URL}/available-equipment`, { 
      params: { startDate, endDate, _t: timestamp } 
    });
    
    console.log('Available equipment raw response:', response);
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data;
    } else if (Array.isArray(response.data)) {
      return { success: true, data: response.data };
    } else {
      console.error('Unexpected response format for available equipment:', response.data);
      return { success: false, data: [], error: 'Unexpected response format' };
    }
  } catch (error) {
    console.error('Error fetching available equipment:', error);
    return { 
      success: false, 
      data: [], 
      error: error.response?.data?.message || 'Failed to fetch available equipment' 
    };
  }
};

// Delete rental
export const deleteRental = async (rentalId) => {
  try {
    const response = await api.delete(`${API_URL}/${rentalId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting rental ${rentalId}:`, error);
    return { success: false, error: error.response?.data?.message || 'Failed to delete rental' };
  }
};

export default {
  getRentals,
  getRental,
  createRental,
  updateRental,
  returnEquipment,
  getAvailableEquipment,
  deleteRental
};