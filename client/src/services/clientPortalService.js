import api from './authService';

const API_URL = '/client';

// Get client dashboard data
export const getClientDashboard = async () => {
  const response = await api.get(`${API_URL}/dashboard`);
  return response.data;
};

// Get client projects
export const getClientProjects = async (params = {}) => {
  const response = await api.get(`${API_URL}/projects`, { params });
  return response.data;
};

// Get client project details
export const getClientProjectDetails = async (departmentId) => {
  const response = await api.get(`${API_URL}/projects/${departmentId}`);
  return response.data;
};

// Get client task details
export const getClientTaskDetails = async (taskId) => {
  const response = await api.get(`${API_URL}/tasks/${taskId}`);
  return response.data;
};

// Download task attachment
export const downloadTaskAttachment = async (taskId, attachmentId) => {
  const response = await api.get(`${API_URL}/tasks/${taskId}/attachments/${attachmentId}/download`, {
    responseType: 'blob'
  });
  return response.data;
};

// Add client feedback
export const addClientFeedback = async (taskId, feedback, approved = false) => {
  const response = await api.post(`${API_URL}/tasks/${taskId}/feedback`, { feedback, approved });
  return response.data;
};

// Get client communication history
export const getClientCommunication = async () => {
  const response = await api.get(`${API_URL}/communication`);
  return response.data;
};

export default {
  getClientDashboard,
  getClientProjects,
  getClientProjectDetails,
  getClientTaskDetails,
  downloadTaskAttachment,
  addClientFeedback,
  getClientCommunication
};