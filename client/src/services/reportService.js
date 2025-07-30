import api from './authService';

const API_URL = '/reports';

// Mock data generators for fallback
const generateMockDashboardData = () => {
  return {
    statusBreakdown: {
      pending: 12,
      inProgress: 8,
      review: 3,
      completed: 25,
      cancelled: 2
    },
    priorityBreakdown: {
      low: 15,
      medium: 20,
      high: 10,
      urgent: 5
    },
    overdueTasks: 4,
    tasksDueToday: 6,
    avgProgress: 68.5,
    totalTasks: 50,
    activeTasks: 23
  };
};

const generateMockDailyReport = () => {
  const today = new Date();
  return {
    date: today.toISOString().split('T')[0],
    tasksCreated: 5,
    tasksCompleted: 8,
    tasksInProgress: 12,
    totalRevenue: 15000,
    activeProjects: 7,
    clientInteractions: 15,
    departmentStats: [
      { name: 'Studio Booking', tasks: 3, completed: 2 },
      { name: 'Graphic Design', tasks: 4, completed: 3 },
      { name: 'Video Editing', tasks: 5, completed: 3 }
    ]
  };
};

const generateMockWeeklyReport = () => {
  return {
    weekStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    weekEnd: new Date().toISOString().split('T')[0],
    tasksCreated: 35,
    tasksCompleted: 42,
    totalRevenue: 125000,
    clientSatisfaction: 4.2,
    projectsDelivered: 8
  };
};

const generateMockMonthlyReport = () => {
  return {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    tasksCreated: 150,
    tasksCompleted: 145,
    totalRevenue: 450000,
    newClients: 12,
    projectsDelivered: 28,
    avgProjectDuration: 12.5
  };
};

// Get daily report
export const getDailyReport = async (params = {}) => {
  try {
    const response = await api.get(`${API_URL}/daily`, { params });
    const data = response.data?.data || response.data;
    
    // Ensure the data structure matches what the component expects
    if (data && !data.statistics) {
      // If we get mock data format, transform it
      return {
        date: params.date || new Date().toISOString().split('T')[0],
        tasks: [],
        statistics: {
          total: data.tasksCreated || 0,
          totalEstimatedHours: 0,
          totalActualHours: 0,
          byStatus: {
            pending: 0,
            inProgress: data.tasksInProgress || 0,
            review: 0,
            completed: data.tasksCompleted || 0,
            cancelled: 0
          },
          byPriority: {
            low: 0,
            medium: 0,
            high: 0,
            urgent: 0
          }
        }
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching daily report:', error);
    // Return properly structured mock data if API fails
    const mockData = generateMockDailyReport();
    return {
      date: params.date || new Date().toISOString().split('T')[0],
      tasks: [],
      statistics: {
        total: mockData.tasksCreated || 0,
        totalEstimatedHours: 0,
        totalActualHours: 0,
        byStatus: {
          pending: 0,
          inProgress: mockData.tasksInProgress || 0,
          review: 0,
          completed: mockData.tasksCompleted || 0,
          cancelled: 0
        },
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0
        }
      }
    };
  }
};

// Get weekly report
export const getWeeklyReport = async (params = {}) => {
  try {
    const response = await api.get(`${API_URL}/weekly`, { params });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching weekly report:', error);
    return generateMockWeeklyReport();
  }
};

// Get monthly report
export const getMonthlyReport = async (params = {}) => {
  try {
    const response = await api.get(`${API_URL}/monthly`, { params });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    return generateMockMonthlyReport();
  }
};

// Get dashboard data
export const getDashboardData = async (params = {}) => {
  try {
    const response = await api.get(`${API_URL}/dashboard`, { params });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return mock dashboard data if API fails
    return generateMockDashboardData();
  }
};

// Export report as PDF
export const exportReportPDF = async (type, params = {}) => {
  try {
    const response = await api.get(`${API_URL}/${type}/export/pdf`, { 
      params,
      responseType: 'blob'
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename
    const date = params.date || new Date().toISOString().split('T')[0];
    link.setAttribute('download', `${type}-report-${date}.pdf`);
    
    // Append to html link element page
    document.body.appendChild(link);
    
    // Start download
    link.click();
    
    // Clean up and remove the link
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};

// Export report as CSV
export const exportReportCSV = async (type, params = {}) => {
  try {
    const response = await api.get(`${API_URL}/${type}/export/csv`, { 
      params,
      responseType: 'blob'
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename
    const date = params.date || new Date().toISOString().split('T')[0];
    link.setAttribute('download', `${type}-report-${date}.csv`);
    
    // Append to html link element page
    document.body.appendChild(link);
    
    // Start download
    link.click();
    
    // Clean up and remove the link
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw error;
  }
};

// Get user-based report
export const getUserReport = async (params = {}) => {
  try {
    const response = await api.get(`${API_URL}/user`, { params });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching user report:', error);
    return { users: [], totalTasks: 0, completionRate: 0 };
  }
};

// Get client-based report
export const getClientReport = async (params = {}) => {
  try {
    const response = await api.get(`${API_URL}/client`, { params });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching client report:', error);
    return { clients: [], totalProjects: 0, revenue: 0 };
  }
};

export default {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getDashboardData,
  getUserReport,
  getClientReport,
  exportReportPDF,
  exportReportCSV
};