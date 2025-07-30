import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInvoice } from '../../services/invoiceService';
import { getUsers } from '../../services/userService';
import { getEquipment } from '../../services/equipmentService';
import { getBillableTasks } from '../../services/taskService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [itemSelectorType, setItemSelectorType] = useState('manual'); // 'manual', 'equipment', 'task'
  const [formData, setFormData] = useState({
    type: 'manual', // manual, studio_booking, task_based, periodic
    client: '',
    clientDetails: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    items: [{
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }],
    subtotal: 0,
    tax: 18, // GST percentage
    taxAmount: 0,
    total: 0,
    dueDate: '',
    notes: '',
    terms: 'Payment due within 30 days of invoice date.'
  });

  // Fetch clients, equipment, and tasks on component mount
  useEffect(() => {
    fetchClients();
    fetchEquipment();
    fetchTasks();
    
    // Set default due date to 30 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    setFormData(prev => ({
      ...prev,
      dueDate: defaultDueDate.toISOString().split('T')[0]
    }));
  }, []);

  // Close item selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showItemSelector && !event.target.closest('.item-selector-dropdown')) {
        setShowItemSelector(false);
        setItemSelectorType('manual');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showItemSelector]);

  const fetchClients = async () => {
    try {
      const response = await getUsers({ role: 'client' });
      if (response.success) {
        setClients(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await getEquipment({ isActive: true, limit: 50 });
      if (response.success) {
        setEquipment(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      // Try to fetch real tasks, fallback to mock data if service not available
      const response = await getBillableTasks();
      if (response.success && response.data) {
        setTasks(response.data);
      } else {
        // Fallback to mock data for demo purposes
        const mockTasks = [
          {
            _id: 'task1',
            title: 'Website Design',
            description: 'Complete website redesign project',
            estimatedHours: 40,
            hourlyRate: 1500,
            status: 'completed'
          },
          {
            _id: 'task2',
            title: 'Logo Design',
            description: 'Brand logo creation',
            estimatedHours: 8,
            hourlyRate: 2000,
            status: 'completed'
          },
          {
            _id: 'task3',
            title: 'Social Media Graphics',
            description: 'Monthly social media content creation',
            estimatedHours: 16,
            hourlyRate: 1200,
            status: 'completed'
          }
        ];
        setTasks(mockTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Use mock data as fallback
      const mockTasks = [
        {
          _id: 'task1',
          title: 'Website Design',
          description: 'Complete website redesign project',
          estimatedHours: 40,
          hourlyRate: 1500,
          status: 'completed'
        },
        {
          _id: 'task2',
          title: 'Logo Design',
          description: 'Brand logo creation',
          estimatedHours: 8,
          hourlyRate: 2000,
          status: 'completed'
        }
      ];
      setTasks(mockTasks);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('clientDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        clientDetails: {
          ...prev.clientDetails,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle client selection
  const handleClientSelect = (clientId) => {
    const selectedClient = clients.find(c => c._id === clientId);
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        client: clientId,
        clientDetails: {
          name: selectedClient.name || '',
          email: selectedClient.email || '',
          phone: selectedClient.phone || '',
          address: selectedClient.address || ''
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        client: '',
        clientDetails: {
          name: '',
          email: '',
          phone: '',
          address: ''
        }
      }));
    }
  };

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };

    // Calculate amount for this item
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }

    setFormData(prev => ({
      ...prev,
      items: newItems
    }));

    // Recalculate totals
    calculateTotals(newItems);
  };

  // Add equipment as item
  const addEquipmentItem = (equipmentId) => {
    const selectedEquipment = equipment.find(e => e._id === equipmentId);
    if (selectedEquipment) {
      const newItem = {
        itemType: 'equipment',
        reference: equipmentId,
        description: `${selectedEquipment.name} - ${selectedEquipment.category}`,
        quantity: 1,
        rate: selectedEquipment.pricing?.rental?.dailyRate || selectedEquipment.pricing?.studio?.dailyRate || 0,
        amount: selectedEquipment.pricing?.rental?.dailyRate || selectedEquipment.pricing?.studio?.dailyRate || 0
      };
      
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
      
      calculateTotals([...formData.items, newItem]);
      setShowItemSelector(false);
    }
  };

  // Add task as item
  const addTaskItem = (taskId) => {
    const selectedTask = tasks.find(t => t._id === taskId);
    if (selectedTask) {
      const newItem = {
        itemType: 'task',
        reference: taskId,
        description: selectedTask.title,
        quantity: selectedTask.estimatedHours,
        rate: selectedTask.hourlyRate,
        amount: selectedTask.estimatedHours * selectedTask.hourlyRate
      };
      
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
      
      calculateTotals([...formData.items, newItem]);
      setShowItemSelector(false);
    }
  };

  // Add new manual item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        itemType: 'manual',
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0
      }]
    }));
    setShowItemSelector(false);
  };

  // Remove item
  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        items: newItems
      }));
      calculateTotals(newItems);
    }
  };

  // Calculate totals
  const calculateTotals = (items = formData.items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = (subtotal * formData.tax) / 100;
    const total = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total
    }));
  };

  // Handle tax change
  const handleTaxChange = (e) => {
    const tax = parseFloat(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      tax
    }));
    
    const subtotal = formData.subtotal;
    const taxAmount = (subtotal * tax) / 100;
    const total = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      taxAmount,
      total
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.clientDetails.name) {
        toast.error('Client name is required');
        return;
      }

      if (formData.items.length === 0 || !formData.items[0].description) {
        toast.error('At least one item is required');
        return;
      }

      const response = await createInvoice(formData);
      
      if (response.success) {
        toast.success('Invoice created successfully!');
        navigate('/invoices');
      } else {
        toast.error(response.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
        <p className="text-gray-600 mt-1">
          Create a new invoice for your client
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: 'manual', label: 'Manual Invoice' },
              { value: 'studio_booking', label: 'Studio Booking' },
              { value: 'task_based', label: 'Task Based' },
              { value: 'periodic', label: 'Periodic' }
            ].map(type => (
              <label key={type.value} className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value={type.value}
                  checked={formData.type === type.value}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>

        {/* Client Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Client Information</h2>
          
          {/* Client Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Existing Client (Optional)
            </label>
            <select
              value={formData.client}
              onChange={(e) => handleClientSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a client or enter manually below</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.name} - {client.email}
                </option>
              ))}
            </select>
          </div>

          {/* Manual Client Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                name="clientDetails.name"
                value={formData.clientDetails.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="clientDetails.email"
                value={formData.clientDetails.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="clientDetails.phone"
                value={formData.clientDetails.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="clientDetails.address"
              value={formData.clientDetails.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Invoice Items</h2>
            <div className="flex space-x-2">
              <div className="relative item-selector-dropdown">
                <button
                  type="button"
                  onClick={() => setShowItemSelector(!showItemSelector)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Item ▼
                </button>
                
                {showItemSelector && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setItemSelectorType('manual');
                          addItem();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        📝 Manual Item
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemSelectorType('equipment')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        🔧 From Equipment
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemSelectorType('task')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        📋 From Tasks
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Equipment/Task Selector */}
          {itemSelectorType === 'equipment' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-3">Select Equipment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                {equipment.map(item => (
                  <div key={item._id} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-gray-500">{item.category}</p>
                    <p className="text-sm font-medium text-green-600">
                      ₹{item.pricing?.rental?.dailyRate || item.pricing?.studio?.dailyRate || 0}/day
                    </p>
                    <button
                      type="button"
                      onClick={() => addEquipmentItem(item._id)}
                      className="mt-2 w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Add to Invoice
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setItemSelectorType('manual')}
                className="mt-3 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          )}

          {itemSelectorType === 'task' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-3">Select Task</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                {tasks.map(task => (
                  <div key={task._id} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <p className="text-xs text-gray-500">{task.description}</p>
                    <p className="text-sm font-medium text-green-600">
                      {task.estimatedHours}h × ₹{task.hourlyRate}/h = ₹{task.estimatedHours * task.hourlyRate}
                    </p>
                    <button
                      type="button"
                      onClick={() => addTaskItem(task._id)}
                      className="mt-2 w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Add to Invoice
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setItemSelectorType('manual')}
                className="mt-3 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          )}

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Item description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate (₹) *
                    </label>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={item.amount}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="ml-2 p-2 text-red-600 hover:text-red-800"
                        title="Remove item"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{formData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Tax:</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={formData.tax}
                      onChange={handleTaxChange}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span>%</span>
                    <span>₹{formData.taxAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{formData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes for the client..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                name="terms"
                value={formData.terms}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Payment terms and conditions..."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;