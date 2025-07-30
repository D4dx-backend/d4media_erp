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
  },

  // Record equipment in/out
  recordInOut: async (equipmentId, inOutData) => {
    const response = await api.post(`/equipment/${equipmentId}/inout`, inOutData);
    return response.data;
  },

  // Get equipment in/out history
  getInOutHistory: async (equipmentId, params = {}) => {
    const response = await api.get(`/equipment/${equipmentId}/inout-history`, { params });
    return response.data;
  },

  // Add maintenance record
  addMaintenanceRecord: async (equipmentId, maintenanceData) => {
    const response = await api.post(`/equipment/${equipmentId}/maintenance`, maintenanceData);
    return response.data;
  },

  // Get equipment maintenance history
  getMaintenanceHistory: async (equipmentId, params = {}) => {
    const response = await api.get(`/equipment/${equipmentId}/maintenance-history`, { params });
    return response.data;
  },

  // Get maintenance report
  getMaintenanceReport: async (params = {}) => {
    const response = await api.get('/equipment/maintenance-report', { params });
    return response.data;
  },

  // Event-based checkout methods
  createEventCheckout: async (checkoutData) => {
    const response = await api.post('/equipment/event-checkout', checkoutData);
    return response.data;
  },

  // Get all event checkouts
  getEventCheckouts: async (params = {}) => {
    const response = await api.get('/equipment/event-checkout', { params });
    return response.data;
  },

  // Return event checkout
  returnEventCheckout: async (checkoutId, returnData) => {
    const response = await api.put(`/equipment/event-checkout/${checkoutId}/return`, returnData);
    return response.data;
  },

  // Get event checkout details
  getEventCheckout: async (checkoutId) => {
    const response = await api.get(`/equipment/event-checkout/${checkoutId}`);
    return response.data;
  }
};

export default equipmentService;