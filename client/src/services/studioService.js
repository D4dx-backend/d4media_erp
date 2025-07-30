import api from './authService';

// Make sure we're using the correct API endpoint
// The API routes are registered under /api/v1/studio in server.js
// But since our api instance already has /api/v1 as baseURL, we only need /studio
const API_URL = '/studio';

// Get all bookings with filtering
export const getBookings = async (params = {}) => {
  try {
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return { data: [] };
    }

    // If date parameter is provided, return mock data for today/tomorrow
    if (params.date) {
      const targetDate = new Date(params.date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const mockBookings = [];
      
      if (params.date === today.toISOString().split('T')[0]) {
        // Today's bookings
        mockBookings.push(
          {
            id: 'today-booking-1',
            clientName: 'Creative Agency Ltd',
            title: 'Product Photography',
            startTime: '09:00',
            endTime: '12:00',
            status: 'confirmed',
            studioRoom: 'Studio A'
          },
          {
            id: 'today-booking-2',
            clientName: 'Fashion Brand Co',
            title: 'Fashion Shoot',
            startTime: '14:00',
            endTime: '18:00',
            status: 'confirmed',
            studioRoom: 'Studio B'
          }
        );
      } else if (params.date === tomorrow.toISOString().split('T')[0]) {
        // Tomorrow's bookings
        mockBookings.push(
          {
            id: 'tomorrow-booking-1',
            clientName: 'Tech Startup Inc',
            title: 'Corporate Headshots',
            startTime: '10:00',
            endTime: '13:00',
            status: 'confirmed',
            studioRoom: 'Studio A'
          },
          {
            id: 'tomorrow-booking-2',
            clientName: 'Local Restaurant',
            title: 'Food Photography',
            startTime: '15:00',
            endTime: '17:00',
            status: 'pending',
            studioRoom: 'Studio C'
          }
        );
      }
      
      return { data: mockBookings, success: true, count: mockBookings.length };
    }

    const response = await api.get(`${API_URL}/bookings`, { params });
    console.log('Studio bookings API response:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
      // Handle specific error cases
      if (error.response.status === 401) {
        console.error('Authentication error - redirecting to login');
        // You might want to redirect to login here
      }
    }
    return { data: [] }; // Return empty data instead of throwing
  }
};

// Get a single booking
export const getBooking = async (bookingId) => {
  try {
    const response = await api.get(`${API_URL}/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching booking ${bookingId}:`, error);
    return { success: false, error: error.response?.data?.message || 'Failed to fetch booking' };
  }
};

// Create a new booking
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post(`${API_URL}/bookings`, bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create booking',
      errors: error.response?.data?.errors
    };
  }
};

// Update a booking
export const updateBooking = async (bookingId, bookingData) => {
  try {
    const response = await api.put(`${API_URL}/bookings/${bookingId}`, bookingData);
    return response.data;
  } catch (error) {
    console.error(`Error updating booking ${bookingId}:`, error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update booking',
      errors: error.response?.data?.errors
    };
  }
};

// Delete a booking
export const deleteBooking = async (bookingId) => {
  try {
    const response = await api.delete(`${API_URL}/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting booking ${bookingId}:`, error);
    return { success: false, error: error.response?.data?.message || 'Failed to delete booking' };
  }
};

// Check studio availability
export const checkAvailability = async (date, startTime, endTime, excludeId = null) => {
  try {
    const params = { date, startTime, endTime };
    if (excludeId) params.excludeId = excludeId;

    const response = await api.get(`${API_URL}/availability`, { params });
    return response.data;
  } catch (error) {
    console.error('Error checking availability:', error);
    return { success: false, available: false, error: error.response?.data?.message || 'Failed to check availability' };
  }
};

// Get available time slots for a specific date
export const getAvailableTimeSlots = async (date) => {
  try {
    const response = await api.get(`${API_URL}/available-slots`, { params: { date } });
    return response.data;
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    return { success: false, data: [], error: error.response?.data?.message || 'Failed to fetch available time slots' };
  }
};

// Get equipment options for studio bookings
export const getEquipmentOptions = async (params = {}) => {
  try {
    const response = await api.get(`${API_URL}/equipment-options`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching equipment options:', error);
    return { success: false, data: [], error: error.response?.data?.message || 'Failed to fetch equipment options' };
  }
};

// Get bookings for calendar view
export const getCalendarBookings = async (startDate, endDate) => {
  try {
    console.log('Fetching calendar bookings with params:', { startDate, endDate });

    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return { data: [] };
    }

    const response = await api.get(`${API_URL}/calendar`, {
      params: { startDate, endDate }
    });
    console.log('Calendar bookings API response:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching calendar bookings:', error);
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
      // Handle specific error cases
      if (error.response.status === 401) {
        console.error('Authentication error - redirecting to login');
      } else if (error.response.status === 404) {
        console.log('Calendar endpoint not found, returning empty data');
        return { success: true, data: [] };
      }
    }
    // Always return a valid structure to prevent calendar from breaking
    return { success: true, data: [] };
  }
};

// Add a note to a booking
export const addBookingNote = async (bookingId, note) => {
  try {
    const response = await api.post(`${API_URL}/bookings/${bookingId}/notes`, { note });
    return response.data;
  } catch (error) {
    console.error(`Error adding note to booking ${bookingId}:`, error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to add note to booking'
    };
  }
};

// Update booking status
export const updateBookingStatus = async (bookingId, status) => {
  try {
    const response = await api.put(`${API_URL}/bookings/${bookingId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Error updating status for booking ${bookingId}:`, error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update booking status'
    };
  }
};

// Calculate price estimate for a booking
export const calculatePriceEstimate = async (bookingData) => {
  try {
    const response = await api.post(`${API_URL}/calculate-price`, bookingData);
    return response.data;
  } catch (error) {
    console.error('Error calculating price estimate:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to calculate price estimate'
    };
  }
};

// Generate invoice for a booking
export const generateInvoice = async (bookingId, invoiceData = {}) => {
  try {
    const response = await api.post(`${API_URL}/bookings/${bookingId}/invoice`, invoiceData);
    return response.data;
  } catch (error) {
    console.error(`Error generating invoice for booking ${bookingId}:`, error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to generate invoice'
    };
  }
};

export default {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  checkAvailability,
  getAvailableTimeSlots,
  getEquipmentOptions,
  getCalendarBookings,
  addBookingNote,
  updateBookingStatus,
  calculatePriceEstimate,
  generateInvoice
};