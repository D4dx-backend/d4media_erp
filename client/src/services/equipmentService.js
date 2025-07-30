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

// Equipment API functions
export const equipmentService = {
  // Get all equipment
  getAllEquipment: async (params = {}) => {
    const response = await api.get('/equipment', { params });
    return response.data;
  },

  // Create new equipment
  createEquipment: async (equipmentData) => {
    const response = await api.post('/equipment', equipmentData);
    return response.data;
  },

  // Update equipment
  updateEquipment: async (id, equipmentData) => {
    const response = await api.put(`/equipment/${id}`, equipmentData);
    return response.data;
  },

  // Delete equipment
  deleteEquipment: async (id) => {
    const response = await api.delete(`/equipment/${id}`);
    return response.data;
  },

  // Get single equipment
  getEquipment: async (id) => {
    const response = await api.get(`/equipment/${id}`);
    return response.data;
  },

  // Request equipment checkout (multiple items)
  requestCheckout: async (checkoutData) => {
    const response = await api.post('/equipment/checkout/request', checkoutData);
    return response.data;
  },

  // Approve/reject checkout request
  approveCheckout: async (checkoutId, approvalData) => {
    const response = await api.put(`/equipment/checkout/${checkoutId}/approve`, approvalData);
    return response.data;
  },

  // Return equipment
  returnEquipment: async (checkoutId, returnData) => {
    const response = await api.put(`/equipment/checkout/${checkoutId}/return`, returnData);
    return response.data;
  },

  // Get checkout history
  getCheckoutHistory: async (params = {}) => {
    const response = await api.get('/equipment/checkout/history', { params });
    return response.data;
  },

  // Get pending approvals
  getPendingApprovals: async () => {
    const response = await api.get('/equipment/checkout/pending');
    return response.data;
  },

  // Generate equipment list PDF
  generateEquipmentPDF: async (params = {}) => {
    const response = await api.get('/equipment/report/pdf', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // Send equipment list via WhatsApp
  sendEquipmentWhatsApp: async (data) => {
    const response = await api.post('/equipment/report/whatsapp', data);
    return response.data;
  }
};

export default equipmentService;