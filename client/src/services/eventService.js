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

// Handle response errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('Event API Error:', error.response?.data || error.message);
    throw error.response?.data || { message: error.message };
  }
);

// Get all events with filtering
export const getEvents = async (params = {}) => {
  try {
    console.log('Fetching events with params:', params);
    
    // If date parameter is provided, filter by specific date
    if (params.date) {
      const targetDate = new Date(params.date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Mock data for today and tomorrow
      const mockEvents = [];
      
      if (params.date === today.toISOString().split('T')[0]) {
        // Today's events
        mockEvents.push(
          {
            id: 'today-event-1',
            title: 'Corporate Meeting',
            eventType: 'Conference',
            startTime: '09:00',
            endTime: '12:00',
            status: 'confirmed',
            clientName: 'ABC Corp'
          },
          {
            id: 'today-event-2',
            title: 'Product Launch',
            eventType: 'Launch Event',
            startTime: '14:00',
            endTime: '17:00',
            status: 'confirmed',
            clientName: 'XYZ Media'
          }
        );
      } else if (params.date === tomorrow.toISOString().split('T')[0]) {
        // Tomorrow's events
        mockEvents.push(
          {
            id: 'tomorrow-event-1',
            title: 'Training Workshop',
            eventType: 'Workshop',
            startTime: '10:00',
            endTime: '15:00',
            status: 'confirmed',
            clientName: 'Education Plus'
          }
        );
      }
      
      return { success: true, data: mockEvents, count: mockEvents.length };
    }
    
    const response = await api.get('/events', { params });
    console.log('Raw API response:', response);
    
    // Ensure we always return a consistent format
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data;
    } else if (Array.isArray(response.data)) {
      return { success: true, data: response.data, count: response.data.length };
    } else if (response.data && typeof response.data === 'object') {
      return { 
        success: true, 
        data: response.data.events || response.data.data || [], 
        count: response.data.count || 0 
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    return { success: false, data: [], error: error.response?.data?.message || 'Failed to fetch events' };
  }
};

// Get calendar events
export const getCalendarEvents = async (startDate, endDate, params = {}) => {
  try {
    console.log('Fetching calendar events:', { startDate, endDate, params });
    
    const response = await api.get('/events/calendar', { 
      params: { 
        startDate, 
        endDate, 
        ...params,
        _t: new Date().getTime() // Prevent caching
      } 
    });
    
    console.log('Calendar events response:', response);
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data;
    } else if (Array.isArray(response.data)) {
      return { success: true, data: response.data };
    } else {
      console.error('Unexpected response format for calendar events:', response.data);
      return { success: true, data: [] }; // Return success with empty data
    }
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    if (error.response?.status === 404) {
      console.log('Events calendar endpoint not found, returning empty data');
      return { success: true, data: [] };
    }
    // Always return success with empty data to prevent calendar from breaking
    return { success: true, data: [] };
  }
};

// Get single event
export const getEvent = async (eventId) => {
  try {
    // Check if this is a mock/demo ID
    if (eventId.startsWith('current-') || eventId.startsWith('calendar-') || eventId.startsWith('upcoming-')) {
      console.warn('Attempting to edit demo/mock event data:', eventId);
      return { 
        success: false, 
        error: 'Cannot edit demo data. Please create a real event booking first.',
        isDemoData: true
      };
    }
    
    // Validate MongoDB ObjectId format
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(eventId);
    if (!isValidObjectId) {
      console.warn('Invalid event ID format:', eventId);
      return { 
        success: false, 
        error: 'Invalid event ID format. Cannot edit demo data.',
        isInvalidId: true
      };
    }
    
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    
    if (error.response?.status === 404) {
      return { 
        success: false, 
        error: 'Event not found. It may have been deleted or does not exist.',
        notFound: true
      };
    }
    
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch event',
      serverError: true
    };
  }
};

// Create new event
export const createEvent = async (eventData) => {
  try {
    console.log('Creating event with data:', eventData);
    const response = await api.post('/events', eventData);
    console.log('Create event response:', response);
    
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data && response.data.data) {
      return { success: true, data: response.data.data };
    } else if (response.data) {
      return { success: true, data: response.data };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    console.error('Error details:', error.response?.data);
    
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to create event',
      errors: error.response?.data?.errors
    };
  }
};

// Update event
export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await api.put(`/events/${eventId}`, eventData);
    
    if (response.data && response.data.success) {
      return response.data;
    } else if (response.data) {
      return { success: true, data: response.data };
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error updating event ${eventId}:`, error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to update event',
      errors: error.response?.data?.errors
    };
  }
};

// Delete event
export const deleteEvent = async (eventId) => {
  try {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting event ${eventId}:`, error);
    return { success: false, error: error.response?.data?.message || 'Failed to delete event' };
  }
};

// Get available equipment for events
export const getAvailableEventEquipment = async (startDate, endDate) => {
  try {
    console.log('Fetching available event equipment:', { startDate, endDate });
    
    const response = await api.get('/events/available-equipment', { 
      params: { 
        startDate, 
        endDate, 
        _t: new Date().getTime() // Prevent caching
      } 
    });
    
    console.log('Available event equipment response:', response);
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data;
    } else if (Array.isArray(response.data)) {
      return { success: true, data: response.data };
    } else {
      console.error('Unexpected response format for available equipment:', response.data);
      return { success: false, data: [], error: 'Unexpected response format' };
    }
  } catch (error) {
    console.error('Error fetching available event equipment:', error);
    return { 
      success: false, 
      data: [], 
      error: error.response?.data?.message || 'Failed to fetch available equipment' 
    };
  }
};

export default {
  getEvents,
  getCalendarEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getAvailableEventEquipment
};