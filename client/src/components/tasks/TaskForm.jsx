import React, { useState, useEffect } from 'react';
import api from '../../services/authService';
import { createTask, updateTask } from '../../services/taskService';
import DepartmentTaskForm from './DepartmentTaskForm';
import TouchInput from '../common/TouchInput';
import TouchSelect from '../common/TouchSelect';
import TouchCheckbox from '../common/TouchCheckbox';
import TouchButton from '../common/TouchButton';
import AddNewButton from '../common/AddNewButton';
import AddNewModal from '../common/AddNewModal';
import FormField from '../common/FormField';

const TaskForm = ({ task = null, onSuccess, onCancel }) => {
  const [departments, setDepartments] = useState([]);
  const [clients, setClients] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [selectedDepartmentCode, setSelectedDepartmentCode] = useState('');
  const [showAddTaskType, setShowAddTaskType] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newTaskType, setNewTaskType] = useState({
    name: '',
    billingRate: 0,
    estimatedHours: 1
  });
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: ''
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    assignedTo: '',
    client: '',
    priority: 'medium',
    taskType: '',
    estimatedHours: 1,
    dueDate: '',
    tags: [],
    billing: {
      rate: 0,
      billable: true
    },
    isUrgent: false
  });

  // Fetch departments, users, and clients for dropdowns
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        console.log('Fetching form data...');
        
        // Fetch data with individual error handling
        let departmentsData = [];
        let clientsData = [];
        
        try {
          const departmentsRes = await api.get('/departments');
          console.log('Departments response:', departmentsRes.data);
          departmentsData = departmentsRes.data.data || departmentsRes.data || [];
        } catch (deptError) {
          console.error('Error fetching departments:', deptError);
          // Provide mock departments if API fails
          departmentsData = [
            { _id: 'mock-1', name: 'Graphic Design', code: 'GD' },
            { _id: 'mock-2', name: 'Video Editing', code: 'VE' },
            { _id: 'mock-3', name: 'Events', code: 'EV' },
            { _id: 'mock-4', name: 'Studio Booking', code: 'SB' }
          ];
          console.log('Using mock departments:', departmentsData);
        }
        
        try {
          const clientsRes = await api.get('/users?role=client');
          console.log('Clients response:', clientsRes.data);
          clientsData = clientsRes.data.data || clientsRes.data || [];
        } catch (clientError) {
          console.error('Error fetching clients:', clientError);
          // Provide mock clients if API fails
          clientsData = [
            { _id: 'mock-client-1', name: 'Test Client 1', company: 'Company A' },
            { _id: 'mock-client-2', name: 'Test Client 2', company: 'Company B' }
          ];
          console.log('Using mock clients:', clientsData);
        }

        // Fetch all users for the assigned to dropdown
        let allUsersData = [];
        try {
          const allUsersRes = await api.get('/users');
          console.log('All users response:', allUsersRes.data);
          allUsersData = allUsersRes.data.data || allUsersRes.data || [];
        } catch (usersError) {
          console.error('Error fetching all users:', usersError);
          // Provide mock users if API fails
          allUsersData = [
            { _id: 'mock-user-1', name: 'John Doe', department: { name: 'Graphic Design' }, role: 'department_staff' },
            { _id: 'mock-user-2', name: 'Jane Smith', department: { name: 'Video Editing' }, role: 'department_staff' },
            { _id: 'mock-user-3', name: 'Mike Johnson', department: { name: 'Events' }, role: 'department_admin' },
            { _id: 'mock-user-4', name: 'Sarah Wilson', department: { name: 'Studio Booking' }, role: 'department_staff' },
            { _id: 'mock-user-5', name: 'Admin User', role: 'super_admin' }
          ];
          console.log('Using mock users:', allUsersData);
        }
        
        console.log('Setting departments:', departmentsData);
        console.log('Setting clients:', clientsData);
        
        setDepartments(departmentsData);
        setClients(clientsData);
        setAllUsers(allUsersData);
        
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Unexpected error in fetchFormData:', error);
        setError('Failed to load form data. Please try again.');
      }
    };
    
    fetchFormData();
  }, []);

  // If editing, populate form with task data
  useEffect(() => {
    if (task) {
      const dueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        department: task.department?._id || task.department || '',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        client: task.client?._id || task.client || '',
        priority: task.priority || 'medium',
        taskType: task.taskType || '',
        estimatedHours: task.estimatedHours || 1,
        dueDate,
        tags: task.tags || [],
        billing: {
          rate: task.billing?.rate || 0,
          billable: task.billing?.billable !== undefined ? task.billing.billable : true
        },
        isUrgent: task.isUrgent || false
      });
    }
  }, [task]);

  // When department changes, fetch users for that department and task types
  useEffect(() => {
    if (formData.department) {
      const fetchDepartmentData = async () => {
        try {
          // Fetch users for the selected department
          let usersData = [];
          try {
            const usersRes = await api.get(`/users?department=${formData.department}`);
            usersData = usersRes.data.data || usersRes.data || [];
          } catch (userError) {
            console.error('Error fetching department users:', userError);
            // Provide mock users if API fails
            usersData = [
              { _id: 'mock-user-1', name: 'John Doe' },
              { _id: 'mock-user-2', name: 'Jane Smith' }
            ];
          }
          setDepartmentUsers(usersData);
          
          // Fetch department details to get task types
          let department = null;
          try {
            const departmentRes = await api.get(`/departments/${formData.department}`);
            department = departmentRes.data.data || departmentRes.data;
          } catch (deptError) {
            console.error('Error fetching department details:', deptError);
            // Provide mock department data based on selected department
            const selectedDept = departments.find(d => d._id === formData.department);
            if (selectedDept) {
              department = {
                ...selectedDept,
                taskTypes: getMockTaskTypes(selectedDept.code || selectedDept.name)
              };
            }
          }
          
          if (department) {
            // Set the department code for department-specific forms
            setSelectedDepartmentCode(department.code || '');
            
            const taskTypesData = department.taskTypes || getMockTaskTypes(department.code || department.name);
            setTaskTypes(taskTypesData);
            
            // If there's no task type selected yet and there are task types available, select the first one
            if (!formData.taskType && taskTypesData.length > 0) {
              setFormData(prev => ({
                ...prev,
                taskType: taskTypesData[0].name,
                billing: {
                  ...prev.billing,
                  rate: taskTypesData[0].billingRate || 0
                }
              }));
            }
          }
        } catch (error) {
          console.error('Error fetching department data:', error);
        }
      };
      
      fetchDepartmentData();
    } else {
      setDepartmentUsers([]);
      setTaskTypes([]);
      setSelectedDepartmentCode('');
    }
  }, [formData.department, departments]);

  // Helper function to get mock task types based on department
  const getMockTaskTypes = (departmentCode) => {
    const taskTypesByDepartment = {
      'GD': [
        { name: 'Logo Design', billingRate: 50, estimatedHours: 4 },
        { name: 'Brochure Design', billingRate: 40, estimatedHours: 6 },
        { name: 'Social Media Graphics', billingRate: 30, estimatedHours: 2 }
      ],
      'VE': [
        { name: 'Video Editing', billingRate: 60, estimatedHours: 8 },
        { name: 'Motion Graphics', billingRate: 70, estimatedHours: 10 },
        { name: 'Color Correction', billingRate: 45, estimatedHours: 3 }
      ],
      'EV': [
        { name: 'Event Planning', billingRate: 55, estimatedHours: 20 },
        { name: 'Event Coordination', billingRate: 45, estimatedHours: 8 },
        { name: 'Event Photography', billingRate: 40, estimatedHours: 6 }
      ],
      'SB': [
        { name: 'Studio Booking', billingRate: 35, estimatedHours: 2 },
        { name: 'Equipment Setup', billingRate: 25, estimatedHours: 1 },
        { name: 'Technical Support', billingRate: 30, estimatedHours: 2 }
      ]
    };

    // Try to match by code first, then by name
    return taskTypesByDepartment[departmentCode] || 
           taskTypesByDepartment[Object.keys(taskTypesByDepartment).find(key => 
             departmentCode.toLowerCase().includes(key.toLowerCase())
           )] ||
           [
             { name: 'General Task', billingRate: 40, estimatedHours: 4 },
             { name: 'Consultation', billingRate: 60, estimatedHours: 1 },
             { name: 'Project Management', billingRate: 50, estimatedHours: 2 }
           ];
  };

  // Update billing rate when task type changes
  useEffect(() => {
    if (formData.taskType && taskTypes.length > 0) {
      const selectedTaskType = taskTypes.find(type => type.name === formData.taskType);
      if (selectedTaskType) {
        setFormData(prev => ({
          ...prev,
          estimatedHours: selectedTaskType.estimatedHours || prev.estimatedHours,
          billing: {
            ...prev.billing,
            rate: selectedTaskType.billingRate || 0
          }
        }));
      }
    }
  }, [formData.taskType, taskTypes]);

  const handleChange = (e) => {
    // Handle both event objects and direct values (for TouchSelect)
    let name, value, type, checked;
    
    if (e && e.target) {
      // Regular input/textarea/checkbox
      ({ name, value, type, checked } = e.target);
    } else {
      // This shouldn't happen with current implementation, but keeping for safety
      console.warn('Unexpected event format:', e);
      return;
    }
    
    if (name.startsWith('billing.')) {
      const billingField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        billing: {
          ...prev.billing,
          [billingField]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Separate handler for TouchSelect components
  const handleSelectChange = (name) => (value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e) => {
    const tagInput = e.target.value;
    const tagsArray = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags: tagsArray }));
  };

  const handleAddTaskType = () => {
    if (!newTaskType.name.trim()) return;
    
    // Add the new task type to the current task types list
    const updatedTaskTypes = [...taskTypes, newTaskType];
    setTaskTypes(updatedTaskTypes);
    
    // Select the newly added task type
    setFormData(prev => ({
      ...prev,
      taskType: newTaskType.name,
      estimatedHours: newTaskType.estimatedHours,
      billing: {
        ...prev.billing,
        rate: newTaskType.billingRate
      }
    }));
    
    // Close modal and reset form
    setShowAddTaskType(false);
    setNewTaskType({ name: '', billingRate: 0, estimatedHours: 1 });
    
    console.log('Added new task type:', newTaskType);
  };

  const handleAddClient = async () => {
    if (!newClient.name.trim() || !newClient.email.trim()) return;
    
    try {
      // Try to create the client via API
      const clientData = {
        ...newClient,
        role: 'client'
      };
      
      const response = await api.post('/users', clientData);
      const createdClient = response.data.data || response.data;
      
      // Add the new client to the current clients list
      const updatedClients = [...clients, createdClient];
      setClients(updatedClients);
      
      // Select the newly added client
      setFormData(prev => ({
        ...prev,
        client: createdClient._id
      }));
      
      console.log('Added new client:', createdClient);
    } catch (error) {
      console.error('Error creating client:', error);
      
      // Fallback: Add as mock client if API fails
      const mockClient = {
        _id: `mock-client-${Date.now()}`,
        ...newClient
      };
      
      const updatedClients = [...clients, mockClient];
      setClients(updatedClients);
      
      setFormData(prev => ({
        ...prev,
        client: mockClient._id
      }));
      
      console.log('Added mock client:', mockClient);
    }
    
    // Close modal and reset form
    setShowAddClient(false);
    setNewClient({ name: '', email: '', phone: '', company: '', address: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (task) {
        // Update existing task
        response = await updateTask(task._id, formData);
      } else {
        // Create new task
        response = await createTask(formData);
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      setError(error.response?.data?.error || 'Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {task ? 'Edit Task' : 'Create New Task'}
      </h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <TouchInput
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Task title"
              size="md"
            />
          </div>
          
          {/* Description */}
          <div className="col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 py-3 px-4 min-h-[120px]"
              placeholder="Task description"
            ></textarea>
          </div>
          
          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department *
            </label>
            <TouchSelect
              id="department"
              name="department"
              value={formData.department}
              onChange={handleSelectChange('department')}
              required
              placeholder="Select Department"
              options={departments.map(dept => ({ value: dept._id, label: dept.name }))}
              size="md"
            />
          </div>
          
          {/* Task Type */}
          <div>
            <label htmlFor="taskType" className="block text-sm font-medium text-gray-700 mb-1">
              Task Type *
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <TouchSelect
                  id="taskType"
                  name="taskType"
                  value={formData.taskType}
                  onChange={handleSelectChange('taskType')}
                  required
                  disabled={!formData.department}
                  placeholder="Select Task Type"
                  options={taskTypes.map(type => ({ value: type.name, label: type.name }))}
                  size="md"
                />
              </div>
              <TouchButton
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowAddTaskType(true)}
                disabled={!formData.department}
                className="whitespace-nowrap flex items-center gap-1 border-dashed border-2 hover:border-solid hover:bg-blue-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Type
              </TouchButton>
            </div>
            {!formData.department && (
              <p className="text-sm text-gray-500 mt-1">Select a department first</p>
            )}
          </div>
          
          {/* Assigned To */}
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
              Assigned To
            </label>
            <TouchSelect
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleSelectChange('assignedTo')}
              placeholder="Unassigned"
              options={allUsers.map(user => ({ 
                value: user._id, 
                label: `${user.name}${user.department?.name ? ` (${user.department.name})` : ''}${user.role === 'super_admin' ? ' - Admin' : ''}` 
              }))}
              size="md"
            />
          </div>
          
          {/* Client */}
          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <TouchSelect
                  id="client"
                  name="client"
                  value={formData.client}
                  onChange={handleSelectChange('client')}
                  placeholder="Select Client"
                  options={clients.map(client => ({ 
                    value: client._id, 
                    label: `${client.name}${client.company ? ` (${client.company})` : ''}` 
                  }))}
                  size="md"
                />
              </div>
              <TouchButton
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowAddClient(true)}
                className="whitespace-nowrap flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Client
              </TouchButton>
            </div>
          </div>
          
          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <TouchSelect
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleSelectChange('priority')}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' }
              ]}
              size="md"
            />
          </div>
          
          {/* Estimated Hours */}
          <div>
            <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Hours
            </label>
            <TouchInput
              type="number"
              id="estimatedHours"
              name="estimatedHours"
              value={formData.estimatedHours}
              onChange={handleChange}
              min="0.1"
              step="0.1"
              size="md"
            />
          </div>
          
          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <TouchInput
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              size="md"
            />
          </div>
          
          {/* Tags */}
          <div className="col-span-2">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <TouchInput
              type="text"
              id="tags"
              name="tags"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              placeholder="design, website, urgent"
              size="md"
            />
          </div>
          
          {/* Billing Rate */}
          <div>
            <label htmlFor="billing.rate" className="block text-sm font-medium text-gray-700 mb-1">
              Billing Rate (per hour)
            </label>
            <TouchInput
              type="number"
              id="billing.rate"
              name="billing.rate"
              value={formData.billing.rate}
              onChange={handleChange}
              min="0"
              step="0.01"
              size="md"
            />
          </div>
          
          {/* Billable Checkbox */}
          <div>
            <TouchCheckbox
              id="billing.billable"
              name="billing.billable"
              checked={formData.billing.billable}
              onChange={handleChange}
              label="Billable Task"
            />
          </div>
          
          {/* Urgent Checkbox */}
          <div>
            <TouchCheckbox
              id="isUrgent"
              name="isUrgent"
              checked={formData.isUrgent}
              onChange={handleChange}
              label="Mark as Urgent"
            />
          </div>
        </div>
        
        {/* Department-specific form fields */}
        {selectedDepartmentCode && (
          <DepartmentTaskForm
            departmentCode={selectedDepartmentCode}
            formData={formData}
            onChange={handleChange}
          />
        )}
        
        {/* Form Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <TouchButton
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
          >
            Cancel
          </TouchButton>
          <TouchButton
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
          >
            {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
          </TouchButton>
        </div>
      </form>

      {/* Add Task Type Modal */}
      {showAddTaskType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                Add New Task Type
              </h3>
              <button
                onClick={() => {
                  setShowAddTaskType(false);
                  setNewTaskType({ name: '', billingRate: 0, estimatedHours: 1 });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Task Type Name */}
              <div>
                <label htmlFor="newTaskTypeName" className="block text-sm font-medium text-gray-700 mb-1">
                  Task Type Name *
                </label>
                <TouchInput
                  type="text"
                  id="newTaskTypeName"
                  name="name"
                  value={newTaskType.name}
                  onChange={(e) => setNewTaskType(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g., Logo Design, Video Editing"
                  size="md"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Billing Rate */}
                <div>
                  <label htmlFor="newTaskTypeBillingRate" className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Rate ($/hr)
                  </label>
                  <TouchInput
                    type="number"
                    id="newTaskTypeBillingRate"
                    name="billingRate"
                    value={newTaskType.billingRate}
                    onChange={(e) => setNewTaskType(prev => ({ ...prev, billingRate: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                    placeholder="50.00"
                    size="md"
                  />
                </div>
                
                {/* Estimated Hours */}
                <div>
                  <label htmlFor="newTaskTypeEstimatedHours" className="block text-sm font-medium text-gray-700 mb-1">
                    Est. Hours
                  </label>
                  <TouchInput
                    type="number"
                    id="newTaskTypeEstimatedHours"
                    name="estimatedHours"
                    value={newTaskType.estimatedHours}
                    onChange={(e) => setNewTaskType(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 1 }))}
                    min="0.1"
                    step="0.1"
                    placeholder="4.0"
                    size="md"
                  />
                </div>
              </div>
            </div>
            
            {/* Modal Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <TouchButton
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  setShowAddTaskType(false);
                  setNewTaskType({ name: '', billingRate: 0, estimatedHours: 1 });
                }}
              >
                Cancel
              </TouchButton>
              <TouchButton
                type="button"
                variant="primary"
                size="md"
                onClick={handleAddTaskType}
                disabled={!newTaskType.name.trim()}
              >
                Add Task Type
              </TouchButton>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                Add New Client
              </h3>
              <button
                onClick={() => {
                  setShowAddClient(false);
                  setNewClient({ name: '', email: '', phone: '', company: '', address: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Client Name */}
                <div>
                  <label htmlFor="newClientName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <TouchInput
                    type="text"
                    id="newClientName"
                    name="name"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="John Doe"
                    size="md"
                  />
                </div>
                
                {/* Company */}
                <div>
                  <label htmlFor="newClientCompany" className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <TouchInput
                    type="text"
                    id="newClientCompany"
                    name="company"
                    value={newClient.company}
                    onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="ABC Corp"
                    size="md"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label htmlFor="newClientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <TouchInput
                    type="email"
                    id="newClientEmail"
                    name="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                    required
                    placeholder="john@example.com"
                    size="md"
                  />
                </div>
                
                {/* Phone */}
                <div>
                  <label htmlFor="newClientPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <TouchInput
                    type="tel"
                    id="newClientPhone"
                    name="phone"
                    value={newClient.phone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    size="md"
                  />
                </div>
              </div>
              
              {/* Address */}
              <div>
                <label htmlFor="newClientAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  id="newClientAddress"
                  name="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 py-2 px-3"
                  placeholder="123 Main St, City, State 12345"
                />
              </div>
            </div>
            
            {/* Modal Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <TouchButton
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  setShowAddClient(false);
                  setNewClient({ name: '', email: '', phone: '', company: '', address: '' });
                }}
              >
                Cancel
              </TouchButton>
              <TouchButton
                type="button"
                variant="primary"
                size="md"
                onClick={handleAddClient}
                disabled={!newClient.name.trim() || !newClient.email.trim()}
              >
                Add Client
              </TouchButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskForm;