import React, { useState, useEffect } from 'react';
import equipmentService from '../../services/equipmentService';

const InOutTracker = ({ equipment, onRefresh }) => {
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [inOutType, setInOutType] = useState('out');
  const [formData, setFormData] = useState({
    quantity: 1,
    purpose: '',
    location: '',
    project: '',
    expectedReturnDate: '',
    condition: 'good',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const availableEquipment = equipment.filter(item => 
    item.isActive && (item.actualAvailableQuantity > 0 || inOutType === 'in')
  );

  const selectedEquipmentData = equipment.find(item => item._id === selectedEquipment);

  useEffect(() => {
    if (selectedEquipment && showHistory) {
      fetchHistory();
    }
  }, [selectedEquipment, showHistory]);

  const fetchHistory = async () => {
    try {
      const response = await equipmentService.getInOutHistory(selectedEquipment);
      setHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = {
        type: inOutType,
        ...formData,
        quantity: parseInt(formData.quantity)
      };

      await equipmentService.recordInOut(selectedEquipment, submitData);
      
      setSuccess(`Equipment ${inOutType === 'out' ? 'checked out' : 'returned'} successfully`);
      setFormData({
        quantity: 1,
        purpose: '',
        location: '',
        project: '',
        expectedReturnDate: '',
        condition: 'good',
        notes: ''
      });
      
      // Refresh equipment list
      onRefresh();
      
      // Refresh history if showing
      if (showHistory) {
        fetchHistory();
      }

    } catch (error) {
      console.error('Error recording in/out:', error);
      setError(error.response?.data?.message || 'Failed to record equipment in/out');
    } finally {
      setLoading(false);
    }
  };

  const getMaxQuantity = () => {
    if (!selectedEquipmentData) return 1;
    
    if (inOutType === 'out') {
      return selectedEquipmentData.actualAvailableQuantity || 0;
    } else {
      return selectedEquipmentData.currentQuantityOut || 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Equipment In/Out Tracker</h2>
          <p className="text-gray-600">Record equipment checkout and return</p>
        </div>
        
        {selectedEquipment && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {showHistory ? 'Hide History' : 'Show History'}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* In/Out Form */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Record Equipment Movement</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Equipment Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Equipment *
              </label>
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose equipment...</option>
                {availableEquipment.map(item => (
                  <option key={item._id} value={item._id}>
                    {item.name} ({item.equipmentCode || 'No Code'}) - Available: {item.actualAvailableQuantity}
                  </option>
                ))}
              </select>
            </div>

            {/* In/Out Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="inOutType"
                    value="out"
                    checked={inOutType === 'out'}
                    onChange={(e) => setInOutType(e.target.value)}
                    className="mr-2"
                  />
                  Check Out
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="inOutType"
                    value="in"
                    checked={inOutType === 'in'}
                    onChange={(e) => setInOutType(e.target.value)}
                    className="mr-2"
                  />
                  Return
                </label>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                max={getMaxQuantity()}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {selectedEquipmentData && (
                <p className="text-sm text-gray-600 mt-1">
                  Max available: {getMaxQuantity()}
                </p>
              )}
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose {inOutType === 'out' && '*'}
              </label>
              <input
                type="text"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                required={inOutType === 'out'}
                placeholder="e.g., Studio recording, Event setup, Client project"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Studio A, Client site, Storage room"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <input
                type="text"
                name="project"
                value={formData.project}
                onChange={handleInputChange}
                placeholder="Project name or reference"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Expected Return Date (for checkout only) */}
            {inOutType === 'out' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Return Date
                </label>
                <input
                  type="date"
                  name="expectedReturnDate"
                  value={formData.expectedReturnDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Condition (for return only) */}
            {inOutType === 'in' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition on Return
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Additional notes or comments"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedEquipment}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Recording...' : `Record ${inOutType === 'out' ? 'Checkout' : 'Return'}`}
            </button>
          </form>
        </div>

        {/* Equipment Info & History */}
        <div className="space-y-6">
          {/* Selected Equipment Info */}
          {selectedEquipmentData && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Equipment Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{selectedEquipmentData.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Code:</span>
                  <span className="font-medium">{selectedEquipmentData.equipmentCode || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{selectedEquipmentData.category}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Quantity:</span>
                  <span className="font-medium">{selectedEquipmentData.availableQuantity}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Currently Out:</span>
                  <span className="font-medium">{selectedEquipmentData.currentQuantityOut || 0}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium text-green-600">
                    {selectedEquipmentData.actualAvailableQuantity || 
                     (selectedEquipmentData.availableQuantity - (selectedEquipmentData.currentQuantityOut || 0))}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedEquipmentData.checkoutStatus === 'available' 
                      ? 'bg-green-100 text-green-800'
                      : selectedEquipmentData.checkoutStatus === 'checked_out'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedEquipmentData.checkoutStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* History */}
          {showHistory && selectedEquipment && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              
              {history.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((record, index) => (
                    <div key={index} className="border-l-4 border-gray-200 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.type === 'out' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {record.type === 'out' ? 'OUT' : 'IN'}
                            </span>
                            <span className="font-medium">Qty: {record.quantity}</span>
                          </div>
                          
                          {record.purpose && (
                            <p className="text-sm text-gray-600 mt-1">
                              Purpose: {record.purpose}
                            </p>
                          )}
                          
                          {record.location && (
                            <p className="text-sm text-gray-600">
                              Location: {record.location}
                            </p>
                          )}
                          
                          {record.notes && (
                            <p className="text-sm text-gray-600">
                              Notes: {record.notes}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-1">
                            By: {record.recordedBy?.name} • {new Date(record.recordedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No activity recorded yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InOutTracker;