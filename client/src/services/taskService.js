import api from "./authService";

const API_URL = "/tasks";

// Get all tasks with filtering
export const getTasks = async (params = {}) => {
  try {
    console.log("Fetching tasks with params:", params);
    const response = await api.get(API_URL, { params });
    console.log("Raw task API response:", response);

    // Ensure we always return a consistent format
    if (
      response.data &&
      response.data.success &&
      Array.isArray(response.data.data)
    ) {
      return response.data;
    } else if (Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data,
        count: response.data.length,
      };
    } else if (response.data && typeof response.data === "object") {
      return {
        success: true,
        data: response.data.tasks || response.data.data || [],
        count: response.data.count || 0,
      };
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return {
      success: false,
      data: [],
      error: error.response?.data?.message || "Failed to fetch tasks",
    };
  }
};

// Get single task item
export const getTaskById = async (taskId) => {
  try {
    const response = await api.get(`${API_URL}/${taskId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch task",
    };
  }
};

// Get completed billable tasks for a client
export const getBillableTasks = async (clientId) => {
  try {
    const response = await api.get(`${API_URL}/billable`, {
      params: {
        client: clientId,
        status: "completed",
        billable: true,
        invoiced: false,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching billable tasks:", error);
    return {
      success: false,
      data: [],
      error: error.response?.data?.message || "Failed to fetch billable tasks",
    };
  }
};

// Create a new task
export const createTask = async (taskData) => {
  try {
    const response = await api.post(API_URL, taskData);
    return response.data;
  } catch (error) {
    console.error("Error creating task:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to create task",
    };
  }
};

// Update an existing task
export const updateTask = async (taskId, taskData) => {
  try {
    const response = await api.put(`${API_URL}/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error("Error updating task:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update task",
    };
  }
};

// Update task progress
export const updateTaskProgress = async (taskId, progress, note = "") => {
  try {
    const response = await api.put(`${API_URL}/${taskId}/progress`, {
      progress,
      note,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating task progress:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to update progress",
    };
  }
};

// Add progress note
export const addProgressNote = async (taskId, note) => {
  try {
    const response = await api.post(`${API_URL}/${taskId}/notes`, { note });
    return response.data;
  } catch (error) {
    console.error("Error adding progress note:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to add note",
    };
  }
};

// Start time tracking
export const startTimeTracking = async (taskId) => {
  try {
    const response = await api.post(`${API_URL}/${taskId}/time/start`);
    return response.data;
  } catch (error) {
    console.error("Error starting time tracking:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to start time tracking",
    };
  }
};

// Stop time tracking
export const stopTimeTracking = async (taskId) => {
  try {
    const response = await api.post(`${API_URL}/${taskId}/time/stop`);
    return response.data;
  } catch (error) {
    console.error("Error stopping time tracking:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to stop time tracking",
    };
  }
};

// Add manual time entry
export const addManualTimeEntry = async (taskId, timeData) => {
  try {
    const response = await api.post(
      `${API_URL}/${taskId}/time/manual`,
      timeData
    );
    return response.data;
  } catch (error) {
    console.error("Error adding manual time entry:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to add time entry",
    };
  }
};

// Get time entries for a task
export const getTimeEntries = async (taskId) => {
  try {
    const response = await api.get(`${API_URL}/${taskId}/time`);
    return response.data;
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return {
      success: false,
      data: [],
      error: error.response?.data?.message || "Failed to fetch time entries",
    };
  }
};

// Delete a task
export const deleteTask = async (taskId) => {
  try {
    const response = await api.delete(`${API_URL}/${taskId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting task:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to delete task",
    };
  }
};

export default {
  getTasks,
  getTaskById,
  getBillableTasks,
  createTask,
  updateTask,
  updateTaskProgress,
  addProgressNote,
  startTimeTracking,
  stopTimeTracking,
  addManualTimeEntry,
  getTimeEntries,
  deleteTask,
};
