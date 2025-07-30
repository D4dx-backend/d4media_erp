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
    console.error('Invoice API Error:', error.response?.data || error.message);
    throw error.response?.data || { message: error.message };
  }
);

/**
 * Get all invoices with filtering
 */
export const getInvoices = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.client) params.append('client', filters.client);
    if (filters.type) params.append('type', filters.type);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const url = `/invoices?${params.toString()}`;
    console.log('Fetching invoices from:', url); // Debug log
    
    const response = await api.get(url);
    console.log('Invoice service response:', response); // Debug log
    
    return response;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    console.error('Error details:', {
      status: error.status,
      message: error.message,
      response: error.response
    });
    throw error;
  }
};

/**
 * Get single invoice by ID
 */
export const getInvoice = async (invoiceId) => {
  try {
    const response = await api.get(`/invoices/${invoiceId}`);
    return response;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
};

/**
 * Create new invoice
 */
export const createInvoice = async (invoiceData) => {
  try {
    const response = await api.post('/invoices', invoiceData);
    return response;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

/**
 * Create invoice from event booking
 */
export const createEventInvoice = async (bookingId) => {
  try {
    const response = await api.post('/invoices/event-booking', { bookingId });
    return response;
  } catch (error) {
    console.error('Error creating event invoice:', error);
    throw error;
  }
};

/**
 * Create invoice from rental
 */
export const createRentalInvoice = async (rentalId) => {
  try {
    const response = await api.post('/invoices/rental', { rentalId });
    return response.data;
  } catch (error) {
    console.error('Error creating rental invoice:', error);
    throw error;
  }
};

/**
 * Update invoice
 */
export const updateInvoice = async (invoiceId, updateData) => {
  try {
    const response = await api.put(`/invoices/${invoiceId}`, updateData);
    return response;
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

/**
 * Update invoice status
 */
export const updateInvoiceStatus = async (invoiceId, status, paidDate = null) => {
  try {
    const response = await api.put(`/invoices/${invoiceId}/status`, {
      status,
      paidDate
    });
    return response;
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
};

/**
 * Delete invoice
 */
export const deleteInvoice = async (invoiceId) => {
  try {
    const response = await api.delete(`/invoices/${invoiceId}`);
    return response;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

/**
 * Generate PDF invoice
 */
export const generateInvoicePDF = async (invoiceId) => {
  try {
    const response = await api.get(`/invoices/${invoiceId}/pdf`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw error;
  }
};

/**
 * Send invoice to customer via WhatsApp
 */
export const sendInvoiceToCustomer = async (invoiceId) => {
  try {
    const response = await api.post(`/invoices/${invoiceId}/send`);
    return response;
  } catch (error) {
    console.error('Error sending invoice to customer:', error);
    throw error;
  }
};

/**
 * Get client invoices (for client portal)
 */
export const getClientInvoices = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/invoices/client?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching client invoices:', error);
    throw error;
  }
};

/**
 * Get invoice statistics
 */
export const getInvoiceStats = async () => {
  try {
    const response = await api.get('/invoices/stats/summary');
    return response;
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    throw error;
  }
};

export default {
  getInvoices,
  getInvoice,
  createInvoice,
  createEventInvoice,
  createRentalInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  generateInvoicePDF,
  sendInvoiceToCustomer,
  getClientInvoices,
  getInvoiceStats
};