import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsersByRole } from '../../services/userService';
import { getUnbilledTasks, getUnbilledBookings, createInvoice } from '../../services/invoiceService';
import LoadingSpinner from '../common/LoadingSpinner';

const InvoiceForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    client: '',
    type: 'task_based',
    discount: 0,
    tax: 0,
    dueDate: '',
    notes: ''
  });

  // Calculate due date 30 days from now for default
  useEffect(() => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    setFormData(prev => ({
      ...prev,
      dueDate: thirtyDaysFromNow.toISOString().split('T')[0]
    }));
  }, []);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await getUsersByRole('client');
        setClients(response.data || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setError('Failed to load clients. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Fetch unbilled items when client or type changes
  useEffect(() => {
    const fetchUnbilledItems = async () => {
      if (!formData.client) return;
      
      try {
        setLoading(true);
        setSelectedItems([]);
        
        if (formData.type === 'task_based') {
          const response = await getUnbilledTasks(formData.client);
          setTasks(response.data || []);
          setBookings([]);
        } else if (formData.type === 'studio_booking') {
          const response = await getUnbilledBookings(formData.client);
          setBookings(response.data || []);
          setTasks([]);
        } else {
          // For periodic invoices, we don't need to fetch items
          setTasks([]);
          setBookings([]);
        }
      } catch (error) {
        console.error('Error fetching unbilled items:', error);
        setError('Failed to load unbilled items. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUnbilledItems();
  }, [formData.client, formData.type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemSelection = (e, itemId) => {
    if (e.target.checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.client) {
      setError('Please select a client');
      return;
    }
    
    if (!formData.dueDate) {
      setError('Please set a due date');
      return;
    }
    
    if (selectedItems.length === 0 && formData.type !== 'periodic') {
      setError('Please select at least one item to invoice');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const invoiceData = {
        ...formData
      };
      
      // Add selected items based on invoice type
      if (formData.type === 'task_based') {
        invoiceData.taskIds = selectedItems;
      } else if (formData.type === 'studio_booking') {
        invoiceData.bookingIds = selectedItems;
      } else if (formData.type === 'periodic') {
        // For periodic invoices, we need to add custom items
        invoiceData.items = customItems.map(item => ({
          type: 'additional',
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate
        }));
      }
      
      const response = await createInvoice(invoiceData);
      navigate(`/invoices/${response.data._id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      setError(error.response?.data?.message || 'Failed to create invoice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // For periodic invoices
  const [customItems, setCustomItems] = useState([
    { description: '', quantity: 1, rate: 0 }
  ]);

  const handleCustomItemChange = (index, field, value) => {
    const updatedItems = [...customItems];
    updatedItems[index][field] = value;
    
    // Auto-calculate amount
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    }
    
    setCustomItems(updatedItems);
  };

  const addCustomItem = () => {
    setCustomItems([...customItems, { description: '', quantity: 1, rate: 0 }]);
  };

  const removeCustomItem = (index) => {
    if (customItems.length > 1) {
      const updatedItems = [...customItems];
      updatedItems.splice(index, 1);
      setCustomItems(updatedItems);
    }
  };

  // Calculate totals
  const calculateSubtotal = () => {
    if (formData.type === 'periodic') {
      return customItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    } else if (formData.type === 'task_based') {
      return tasks
        .filter(task => selectedItems.includes(task._id))
        .reduce((sum, task) => sum + ((task.actualHours || task.estimatedHours) * task.billing.rate), 0);
    } else if (formData.type === 'studio_booking') {
      return bookings
        .filter(booking => selectedItems.includes(booking._id))
        .reduce((sum, booking) => sum + booking.pricing.totalAmount, 0);
    }
    return 0;
  };

  const subtotal = calculateSubtotal();
  const discount = parseFloat(formData.discount) || 0;
  const tax = parseFloat(formData.tax) || 0;
  const total = subtotal - discount + tax;

  if (loading && clients.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Create New Invoice</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
              Client *
            </label>
            <select
              id="client"
              name="client"
              value={formData.client}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Client</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.name} {client.company ? `(${client.company})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="task_based">Task Based</option>
              <option value="studio_booking">Studio Booking</option>
              <option value="periodic">Periodic/Custom</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="1"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Items Selection Section */}
        {formData.client && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {formData.type === 'task_based' 
                ? 'Select Tasks to Invoice' 
                : formData.type === 'studio_booking' 
                  ? 'Select Bookings to Invoice' 
                  : 'Add Custom Items'}
            </h3>
            
            {loading ? (
              <div className="py-4 text-center">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {formData.type === 'task_based' && (
                  <div className="overflow-x-auto">
                    {tasks.length === 0 ? (
                      <p className="text-gray-500 py-4">No unbilled tasks found for this client.</p>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <input
                                type="checkbox"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedItems(tasks.map(task => task._id));
                                  } else {
                                    setSelectedItems([]);
                                  }
                                }}
                                checked={selectedItems.length === tasks.length && tasks.length > 0}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Task
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hours
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rate
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {tasks.map(task => (
                            <tr key={task._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  value={task._id}
                                  checked={selectedItems.includes(task._id)}
                                  onChange={(e) => handleItemSelection(e, task._id)}
                                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {task.title}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {task.actualHours || task.estimatedHours}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${task.billing.rate.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${((task.actualHours || task.estimatedHours) * task.billing.rate).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
                
                {formData.type === 'studio_booking' && (
                  <div className="overflow-x-auto">
                    {bookings.length === 0 ? (
                      <p className="text-gray-500 py-4">No unbilled bookings found for this client.</p>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <input
                                type="checkbox"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedItems(bookings.map(booking => booking._id));
                                  } else {
                                    setSelectedItems([]);
                                  }
                                }}
                                checked={selectedItems.length === bookings.length && bookings.length > 0}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Purpose
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {bookings.map(booking => (
                            <tr key={booking._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  value={booking._id}
                                  checked={selectedItems.includes(booking._id)}
                                  onChange={(e) => handleItemSelection(e, booking._id)}
                                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(booking.bookingDate).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {booking.timeSlot.startTime} - {booking.timeSlot.endTime}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {booking.purpose}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${booking.pricing.totalAmount.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
                
                {formData.type === 'periodic' && (
                  <div className="space-y-4">
                    {customItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5">
                          <label className="sr-only">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleCustomItemChange(index, 'description', e.target.value)}
                            placeholder="Item description"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="sr-only">Quantity</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleCustomItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0.01"
                            step="0.01"
                            placeholder="Qty"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="sr-only">Rate</label>
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleCustomItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                            min="0.01"
                            step="0.01"
                            placeholder="Rate"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <span className="block w-full px-3 py-2 text-gray-700">
                            ${(item.quantity * item.rate).toFixed(2)}
                          </span>
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeCustomItem(index)}
                            className="text-red-600 hover:text-red-900"
                            disabled={customItems.length === 1}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addCustomItem}
                      className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Item
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Totals Section */}
        <div className="border-t border-gray-200 pt-4 mt-6">
          <div className="flex justify-end">
            <div className="w-full md:w-1/3 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="text-gray-900 font-medium">${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <label htmlFor="discount" className="text-gray-700">Discount:</label>
                <div className="flex items-center">
                  <span className="mr-2">$</span>
                  <input
                    type="number"
                    id="discount"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <label htmlFor="tax" className="text-gray-700">Tax:</label>
                <div className="flex items-center">
                  <span className="mr-2">$</span>
                  <input
                    type="number"
                    id="tax"
                    name="tax"
                    value={formData.tax}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-bold">Total:</span>
                <span className="text-gray-900 font-bold">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {submitting ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;