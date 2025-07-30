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
    console.error('Quotation API Error:', error.response?.data || error.message);
    throw error.response?.data || { message: error.message };
  }
);

/**
 * Get all quotations with filtering
 */
export const getQuotations = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.client) params.append('client', filters.client);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const url = `/quotations?${params.toString()}`;
    console.log('Fetching quotations from:', url);
    
    const response = await api.get(url);
    console.log('Quotation service response:', response);
    
    return response;
  } catch (error) {
    console.error('Error fetching quotations:', error);
    throw error;
  }
};

/**
 * Get single quotation by ID
 */
export const getQuotation = async (quotationId) => {
  try {
    const response = await api.get(`/quotations/${quotationId}`);
    return response;
  } catch (error) {
    console.error('Error fetching quotation:', error);
    throw error;
  }
};

/**
 * Create new quotation
 */
export const createQuotation = async (quotationData) => {
  try {
    const response = await api.post('/quotations', quotationData);
    return response;
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
};

/**
 * Update quotation
 */
export const updateQuotation = async (quotationId, updateData) => {
  try {
    const response = await api.put(`/quotations/${quotationId}`, updateData);
    return response;
  } catch (error) {
    console.error('Error updating quotation:', error);
    throw error;
  }
};

/**
 * Update quotation status
 */
export const updateQuotationStatus = async (quotationId, status) => {
  try {
    const response = await api.put(`/quotations/${quotationId}/status`, {
      status
    });
    return response;
  } catch (error) {
    console.error('Error updating quotation status:', error);
    throw error;
  }
};

/**
 * Convert quotation to invoice
 */
export const convertToInvoice = async (quotationId) => {
  try {
    const response = await api.post(`/quotations/${quotationId}/convert-to-invoice`);
    return response;
  } catch (error) {
    console.error('Error converting quotation to invoice:', error);
    throw error;
  }
};

/**
 * Delete quotation
 */
export const deleteQuotation = async (quotationId) => {
  try {
    const response = await api.delete(`/quotations/${quotationId}`);
    return response;
  } catch (error) {
    console.error('Error deleting quotation:', error);
    throw error;
  }
};

/**
 * Generate PDF quotation
 */
export const generateQuotationPDF = async (quotationId) => {
  try {
    const response = await api.get(`/quotations/${quotationId}/pdf`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    throw error;
  }
};

/**
 * Send quotation to customer via WhatsApp
 */
export const sendQuotationToCustomer = async (quotationId) => {
  try {
    const response = await api.post(`/quotations/${quotationId}/send`);
    return response;
  } catch (error) {
    console.error('Error sending quotation to customer:', error);
    throw error;
  }
};

/**
 * Get client quotations (for client portal)
 */
export const getClientQuotations = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/quotations/client?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching client quotations:', error);
    throw error;
  }
};

/**
 * Get quotation statistics
 */
export const getQuotationStats = async () => {
  try {
    const response = await api.get('/quotations/stats/summary');
    return response;
  } catch (error) {
    console.error('Error fetching quotation stats:', error);
    throw error;
  }
};

export default {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  convertToInvoice,
  deleteQuotation,
  generateQuotationPDF,
  sendQuotationToCustomer,
  getClientQuotations,
  getQuotationStats
};