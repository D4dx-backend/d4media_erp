import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuotation } from '../../services/quotationService';
import { getUsers } from '../../services/userService';
import { getEquipment } from '../../services/equipmentService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CreateQuotation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [formData, setFormData] = useState({
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
    validUntil: '',
    notes: '',
    terms: 'This quotation is valid for 30 days from the date of issue.'
  });

  // Fetch clients and equipment on component mount
  useEffect(() => {
    fetchClients();
    fetchEquipment();
    
    // Set default validity to 30 days from now
    const defaultValidUntil = new Date();
    defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);
    setFormData(prev => ({
      ...prev,
      validUntil: defaultValidUntil.toISOString().split('T')[0]
    }));
  }, []);

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
      } else {
        console.log('Equipment response:', response);
        setEquipment([]);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setEquipment([]);
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
    }
  };

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0
      }]
    }));
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

      const response = await createQuotation(formData);
      
      if (response.success) {
        toast.success('Quotation created successfully!');
        navigate('/quotations');
      } else {
        toast.error(response.message || 'Failed to create quotation');
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast.error(error.message || 'Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Quotation</h1>
        <p className="text-gray-600 mt-1">
          Create a new quotation for your client
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                Valid Until *
              </label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
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

        {/* Equipment Quick Add */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Add Equipment</h2>
          {equipment.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipment.slice(0, 6).map(item => (
                <div key={item._id} className="border border-gray-200 rounded-lg p-3">
                  <h3 className="font-medium text-sm">{item.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                  <p className="text-sm font-medium text-green-600">
                    ₹{item.pricing?.rental?.dailyRate || item.pricing?.studio?.dailyRate || 0}/day
                  </p>
                  <button
                    type="button"
                    onClick={() => addEquipmentItem(item._id)}
                    className="mt-2 w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Add to Quote
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No equipment available. Please add equipment first.</p>
              <button
                type="button"
                onClick={() => window.open('/equipment', '_blank')}
                className="mt-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Manage Equipment
              </button>
            </div>
          )}
        </div>

        {/* Quotation Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Quotation Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>

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
                placeholder="Quotation terms and conditions..."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/quotations')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Create Quotation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuotation;