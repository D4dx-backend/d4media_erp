import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import equipmentService from '../../services/equipmentService';
import { 
  Calendar, 
  User, 
  MapPin, 
  Package, 
  Clock, 
  Plus,
  Search,
  Filter,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const InOutTracker = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('checkout');
  const [equipment, setEquipment] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form state for new checkout
  const [formData, setFormData] = useState({
    eventName: '',
    eventType: 'event', // event, client_project, temporary, maintenance
    responsiblePerson: '',
    contactNumber: '',
    eventDate: '',
    eventLocation: '',
    expectedReturnDate: '',
    items: [],
    notes: ''
  });

  // Check if user can record in/out
  const canRecordInOut = ['super_admin', 'department_admin', 'reception'].includes(user?.role);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [equipmentRes, checkoutsRes] = await Promise.all([
        equipmentService.getAllEquipment(),
        equipmentService.getEventCheckouts()
      ]);
      
      setEquipment(equipmentRes.data || []);
      setCheckouts(checkoutsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addEquipmentItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { equipmentId: '', quantity: 1, notes: '' }]
    }));
  };

  const removeEquipmentItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateEquipmentItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSubmitCheckout = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      setError('Please add at least one equipment item');
      return;
    }

    try {
      await equipmentService.createEventCheckout(formData);
      setSuccess('Equipment checkout recorded successfully');
      setFormData({
        eventName: '',
        eventType: 'event',
        responsiblePerson: '',
        contactNumber: '',
        eventDate: '',
        eventLocation: '',
        expectedReturnDate: '',
        items: [],
        notes: ''
      });
      setShowForm(false);
      await fetchData();
    } catch (error) {
      console.error('Error creating checkout:', error);
      setError(error.response?.data?.message || 'Failed to record checkout');
    }
  };

  const handleReturn = async (checkoutId, returnData) => {
    try {
      await equipmentService.returnEventCheckout(checkoutId, returnData);
      setSuccess('Equipment returned successfully');
      await fetchData();
    } catch (error) {
      console.error('Error returning equipment:', error);
      setError(error.response?.data?.message || 'Failed to return equipment');
    }
  };

  const getAvailableQuantity = (equipmentId) => {
    const item = equipment.find(e => e._id === equipmentId);
    return item ? item.actualAvailableQuantity || 0 : 0;
  };

  const filteredCheckouts = checkouts.filter(checkout => {
    const matchesSearch = checkout.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         checkout.responsiblePerson.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || checkout.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment In/Out Tracker</h1>
          <p className="text-gray-600">Track equipment for events, projects, and temporary use</p>
        </div>
        
        {canRecordInOut && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Checkout
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by event name or responsible person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="checked_out">Checked Out</option>
            <option value="returned">Returned</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Checkouts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Equipment Checkouts</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredCheckouts.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No checkouts found
            </div>
          ) : (
            filteredCheckouts.map((checkout) => (
              <CheckoutCard 
                key={checkout._id} 
                checkout={checkout} 
                onReturn={handleReturn}
                canReturn={canRecordInOut}
              />
            ))
          )}
        </div>
      </div>

      {/* Checkout Form Modal */}
      {showForm && (
        <CheckoutForm
          formData={formData}
          equipment={equipment}
          onInputChange={handleInputChange}
          onSubmit={handleSubmitCheckout}
          onCancel={() => {
            setShowForm(false);
            setFormData({
              eventName: '',
              eventType: 'event',
              responsiblePerson: '',
              contactNumber: '',
              eventDate: '',
              eventLocation: '',
              expectedReturnDate: '',
              items: [],
              notes: ''
            });
          }}
          addEquipmentItem={addEquipmentItem}
          removeEquipmentItem={removeEquipmentItem}
          updateEquipmentItem={updateEquipmentItem}
          getAvailableQuantity={getAvailableQuantity}
        />
      )}
    </div>
  );
};

// Checkout Card Component
const CheckoutCard = ({ checkout, onReturn, canReturn }) => {
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnData, setReturnData] = useState({
    returnDate: new Date().toISOString().split('T')[0],
    condition: 'good',
    notes: ''
  });

  const isOverdue = checkout.status === 'checked_out' && 
                   new Date(checkout.expectedReturnDate) < new Date();

  const handleReturn = () => {
    onReturn(checkout._id, returnData);
    setShowReturnForm(false);
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-lg font-medium text-gray-900">{checkout.eventName}</h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              checkout.status === 'returned' 
                ? 'bg-green-100 text-green-800'
                : isOverdue
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {checkout.status === 'returned' ? 'Returned' : isOverdue ? 'Overdue' : 'Checked Out'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{checkout.responsiblePerson}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(checkout.eventDate).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{checkout.eventLocation}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Return: {new Date(checkout.expectedReturnDate).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">Equipment Items:</p>
            <div className="flex flex-wrap gap-2">
              {checkout.items.map((item, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                  <Package className="h-3 w-3 mr-1" />
                  {item.equipment?.name} (Qty: {item.quantity})
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {canReturn && checkout.status === 'checked_out' && (
          <div className="ml-4">
            <button
              onClick={() => setShowReturnForm(true)}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
            >
              Return
            </button>
          </div>
        )}
      </div>
      
      {/* Return Form */}
      {showReturnForm && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-3">Return Equipment</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
              <input
                type="date"
                value={returnData.returnDate}
                onChange={(e) => setReturnData(prev => ({ ...prev, returnDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                value={returnData.condition}
                onChange={(e) => setReturnData(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={returnData.notes}
                onChange={(e) => setReturnData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Return notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleReturn}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Confirm Return
            </button>
            <button
              onClick={() => setShowReturnForm(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Checkout Form Component
const CheckoutForm = ({ 
  formData, 
  equipment, 
  onInputChange, 
  onSubmit, 
  onCancel,
  addEquipmentItem,
  removeEquipmentItem,
  updateEquipmentItem,
  getAvailableQuantity
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">New Equipment Checkout</h3>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event/Project Name *
              </label>
              <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={onInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={onInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="event">Event</option>
                <option value="client_project">Client Project</option>
                <option value="temporary">Temporary Use</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsible Person *
              </label>
              <input
                type="text"
                name="responsiblePerson"
                value={formData.responsiblePerson}
                onChange={onInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Date *
              </label>
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={onInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Return Date *
              </label>
              <input
                type="date"
                name="expectedReturnDate"
                value={formData.expectedReturnDate}
                onChange={onInputChange}
                required
                min={formData.eventDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Location
            </label>
            <input
              type="text"
              name="eventLocation"
              value={formData.eventLocation}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Equipment Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900">Equipment Items</h4>
              <button
                type="button"
                onClick={addEquipmentItem}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Add Item
              </button>
            </div>
            
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment *
                  </label>
                  <select
                    value={item.equipmentId}
                    onChange={(e) => updateEquipmentItem(index, 'equipmentId', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select equipment...</option>
                    {equipment.filter(eq => eq.isActive && eq.actualAvailableQuantity > 0).map(eq => (
                      <option key={eq._id} value={eq._id}>
                        {eq.name} (Available: {eq.actualAvailableQuantity})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateEquipmentItem(index, 'quantity', parseInt(e.target.value))}
                    min="1"
                    max={getAvailableQuantity(item.equipmentId)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => updateEquipmentItem(index, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeEquipmentItem(index)}
                    className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={onInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Form Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Checkout
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InOutTracker;