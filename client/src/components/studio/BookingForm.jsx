import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  createBooking, 
  updateBooking, 
  checkAvailability, 
  getEquipmentOptions, 
  getAvailableTimeSlots as getTimeSlotOptions 
} from '../../services/studioService';
import { getUsers } from '../../services/userService';
import LoadingSpinner from '../common/LoadingSpinner';

const BookingForm = ({ booking = null, selectedDate = new Date(), onCancel, onSuccess }) => {
  console.log('BookingForm rendered with:', { booking, selectedDate });
  const [formData, setFormData] = useState({
    client: '',
    contactPerson: {
      name: '',
      phone: '',
      email: ''
    },
    bookingDate: selectedDate && !isNaN(new Date(selectedDate)) ? format(new Date(selectedDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    timeSlot: {
      startTime: '09:00',
      endTime: '10:00'
    },
    duration: 1,
    purpose: '',
    requirements: '',
    teamSize: 1,
    equipment: [],
    status: 'inquiry',
    pricing: {
      baseRate: 2000,
      equipmentCost: 0,
      additionalCharges: [],
      discount: 0,
      totalAmount: 2000
    }
  });
  
  const [clients, setClients] = useState([]);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [additionalCharge, setAdditionalCharge] = useState({ description: '', amount: 0 });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load clients (users with client role)
        const usersResponse = await getUsers({ role: 'client' });
        console.log('Users response:', usersResponse);
        if (usersResponse.success && usersResponse.data) {
          setClients(usersResponse.data);
        } else {
          console.error('Failed to fetch clients:', usersResponse.error);
          setClients([]);
        }
        
        // Load equipment options
        const equipmentResponse = await getEquipmentOptions({ tags: ['studio'] });
        console.log('Equipment options response:', equipmentResponse);
        
        // Use mock equipment data if API fails
        const equipmentData = equipmentResponse.data || [
          { id: 'camera', name: 'Professional Camera', rate: 50 },
          { id: 'lighting', name: 'Lighting Kit', rate: 30 },
          { id: 'microphone', name: 'Professional Microphone', rate: 20 },
          { id: 'greenscreen', name: 'Green Screen', rate: 15 }
        ];
        setEquipmentOptions(equipmentData);
        
        // Generate time slots (9:00 AM to 8:00 PM in 30-minute increments)
        const timeSlotOptions = [];
        for (let hour = 9; hour <= 20; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const formattedHour = hour.toString().padStart(2, '0');
            const formattedMinute = minute.toString().padStart(2, '0');
            timeSlotOptions.push(`${formattedHour}:${formattedMinute}`);
          }
        }
        setTimeSlots(timeSlotOptions);
        
        // If editing, populate form with booking data
        if (booking) {
          const bookingData = {
            client: booking.client?._id || booking.client || '',
            contactPerson: {
              name: booking.contactPerson?.name || '',
              phone: booking.contactPerson?.phone || '',
              email: booking.contactPerson?.email || ''
            },
            bookingDate: booking.bookingDate && !isNaN(new Date(booking.bookingDate)) ? 
              format(new Date(booking.bookingDate), 'yyyy-MM-dd') : 
              format(new Date(), 'yyyy-MM-dd'),
            timeSlot: {
              startTime: booking.timeSlot?.startTime || '09:00',
              endTime: booking.timeSlot?.endTime || '10:00'
            },
            duration: booking.duration || 1,
            purpose: booking.purpose || '',
            requirements: booking.requirements || '',
            teamSize: booking.teamSize || 1,
            equipment: booking.equipment || [],
            status: booking.status || 'inquiry',
            pricing: {
              baseRate: booking.pricing?.baseRate || 2000,
              equipmentCost: booking.pricing?.equipmentCost || 0,
              additionalCharges: booking.pricing?.additionalCharges || [],
              discount: booking.pricing?.discount || 0,
              totalAmount: booking.pricing?.totalAmount || 2000
            }
          };
          
          setFormData(bookingData);
          setSelectedEquipment(bookingData.equipment || []);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load form data. Please try again.');
        console.error('Error loading form data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [booking]);
  
  // Calculate duration when time slot changes
  useEffect(() => {
    if (formData.timeSlot?.startTime && formData.timeSlot?.endTime) {
      const [startHour, startMinute] = formData.timeSlot.startTime.split(':').map(Number);
      const [endHour, endMinute] = formData.timeSlot.endTime.split(':').map(Number);
      
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;
      
      let durationInMinutes = endTimeInMinutes - startTimeInMinutes;
      if (durationInMinutes < 0) {
        durationInMinutes += 24 * 60; // Add a day if end time is on the next day
      }
      
      const durationInHours = durationInMinutes / 60;
      
      setFormData(prev => ({
        ...prev,
        duration: durationInHours
      }));
    }
  }, [formData.timeSlot?.startTime, formData.timeSlot?.endTime]);
  
  // Calculate total amount when relevant fields change
  useEffect(() => {
    const calculateTotal = () => {
      const baseAmount = formData.pricing.baseRate * formData.duration;
      const equipmentCost = selectedEquipment.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
      const additionalChargesTotal = formData.pricing.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
      const discount = formData.pricing.discount || 0;
      
      const totalAmount = baseAmount + equipmentCost + additionalChargesTotal - discount;
      
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          equipmentCost,
          totalAmount: Math.max(0, totalAmount)
        },
        equipment: selectedEquipment
      }));
    };
    
    calculateTotal();
  }, [
    formData.pricing.baseRate, 
    formData.duration, 
    selectedEquipment, 
    formData.pricing.additionalCharges, 
    formData.pricing.discount
  ]);
  
  // Check availability when date or time changes
  useEffect(() => {
    const checkTimeSlotAvailability = async () => {
      if (!formData.bookingDate || !formData.timeSlot?.startTime || !formData.timeSlot?.endTime) {
        return;
      }
      
      try {
        setChecking(true);
        const response = await checkAvailability(
          formData.bookingDate,
          formData.timeSlot?.startTime,
          formData.timeSlot?.endTime
        );
        
        setIsAvailable(response.available);
      } catch (err) {
        console.error('Error checking availability:', err);
        setIsAvailable(false);
      } finally {
        setChecking(false);
      }
    };
    
    // Only check if this is a new booking or if date/time has changed for existing booking
    if (!booking || 
        formData.bookingDate !== (booking.bookingDate && !isNaN(new Date(booking.bookingDate)) ? format(new Date(booking.bookingDate), 'yyyy-MM-dd') : '') ||
        formData.timeSlot?.startTime !== booking.timeSlot?.startTime ||
        formData.timeSlot?.endTime !== booking.timeSlot?.endTime) {
      checkTimeSlotAvailability();
    }
  }, [formData.bookingDate, formData.timeSlot?.startTime, formData.timeSlot?.endTime, booking]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleEquipmentChange = (e) => {
    const equipmentId = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
      const equipment = equipmentOptions.find(item => item.id === equipmentId);
      if (equipment) {
        setSelectedEquipment(prev => [
          ...prev,
          { name: equipment.name, quantity: 1, rate: equipment.rate }
        ]);
      }
    } else {
      setSelectedEquipment(prev => prev.filter(item => item.name !== equipmentOptions.find(e => e.id === equipmentId)?.name));
    }
  };
  
  const handleEquipmentQuantityChange = (index, quantity) => {
    setSelectedEquipment(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: parseInt(quantity) || 1 };
      return updated;
    });
  };
  
  const handleAddAdditionalCharge = () => {
    if (additionalCharge.description && additionalCharge.amount > 0) {
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          additionalCharges: [
            ...prev.pricing.additionalCharges,
            { ...additionalCharge }
          ]
        }
      }));
      
      setAdditionalCharge({ description: '', amount: 0 });
    }
  };
  
  const handleRemoveAdditionalCharge = (index) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        additionalCharges: prev.pricing.additionalCharges.filter((_, i) => i !== index)
      }
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAvailable && formData.status === 'confirmed') {
      setError('Cannot confirm booking: Time slot is not available.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      if (booking) {
        // Update existing booking
        await updateBooking(booking._id, formData);
        setSuccess('Booking updated successfully!');
      } else {
        // Create new booking
        await createBooking(formData);
        setSuccess('Booking created successfully!');
      }
      
      // Notify parent component
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save booking. Please try again.');
      console.error('Error saving booking:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Client Information</h3>
          
          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              id="client"
              name="client"
              value={formData.client}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            <label htmlFor="contactPerson.name" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name
            </label>
            <input
              type="text"
              id="contactPerson.name"
              name="contactPerson.name"
              value={formData.contactPerson.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="contactPerson.phone" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              id="contactPerson.phone"
              name="contactPerson.phone"
              value={formData.contactPerson.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="contactPerson.email" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              id="contactPerson.email"
              name="contactPerson.email"
              value={formData.contactPerson.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="email@example.com (optional)"
            />
          </div>
        </div>
        
        {/* Booking Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
          
          <div>
            <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="bookingDate"
              name="bookingDate"
              value={formData.bookingDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="timeSlot.startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <select
                id="timeSlot.startTime"
                name="timeSlot.startTime"
                value={formData.timeSlot?.startTime || '09:00'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="timeSlot.endTime" className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <select
                id="timeSlot.endTime"
                name="timeSlot.endTime"
                value={formData.timeSlot?.endTime || '10:00'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {checking ? (
            <div className="text-sm text-gray-500">Checking availability...</div>
          ) : (
            <div className={`text-sm ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {isAvailable ? 'Time slot is available' : 'Time slot is not available'}
            </div>
          )}
          
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (hours)
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="0.5"
              step="0.5"
              readOnly
            />
          </div>
          
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="teamSize" className="block text-sm font-medium text-gray-700 mb-1">
              Team Size
            </label>
            <input
              type="number"
              id="teamSize"
              name="teamSize"
              value={formData.teamSize}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="1"
              required
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="inquiry">Inquiry</option>
              <option value="confirmed" disabled={!isAvailable}>Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Equipment */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Equipment</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equipmentOptions.map(equipment => (
            <div key={equipment.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`equipment-${equipment.id}`}
                value={equipment.id}
                checked={selectedEquipment.some(item => item.name === equipment.name)}
                onChange={handleEquipmentChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`equipment-${equipment.id}`} className="flex-grow text-sm text-gray-700">
                {equipment.name} (₹{equipment.rate}/hour)
              </label>
              {selectedEquipment.some(item => item.name === equipment.name) && (
                <input
                  type="number"
                  value={selectedEquipment.find(item => item.name === equipment.name)?.quantity || 1}
                  onChange={(e) => {
                    const index = selectedEquipment.findIndex(item => item.name === equipment.name);
                    handleEquipmentQuantityChange(index, e.target.value);
                  }}
                  min="1"
                  className="w-16 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="pricing.baseRate" className="block text-sm font-medium text-gray-700 mb-1">
              Base Rate (per hour)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                id="pricing.baseRate"
                name="pricing.baseRate"
                value={formData.pricing.baseRate}
                onChange={handleInputChange}
                className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="1"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="pricing.discount" className="block text-sm font-medium text-gray-700 mb-1">
              Discount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                id="pricing.discount"
                name="pricing.discount"
                value={formData.pricing.discount}
                onChange={handleInputChange}
                className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="1"
              />
            </div>
          </div>
        </div>
        
        {/* Additional Charges */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Charges</h4>
          
          <div className="space-y-2">
            {formData.pricing.additionalCharges.map((charge, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="flex-grow">{charge.description}</div>
                <div className="text-gray-700">₹{charge.amount.toFixed(2)}</div>
                <button
                  type="button"
                  onClick={() => handleRemoveAdditionalCharge(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
            
            <div className="flex items-end space-x-2">
              <div className="flex-grow">
                <label htmlFor="additionalChargeDescription" className="block text-xs font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="additionalChargeDescription"
                  value={additionalCharge.description}
                  onChange={(e) => setAdditionalCharge({ ...additionalCharge, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="w-24">
                <label htmlFor="additionalChargeAmount" className="block text-xs font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    id="additionalChargeAmount"
                    value={additionalCharge.amount}
                    onChange={(e) => setAdditionalCharge({ ...additionalCharge, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddAdditionalCharge}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Add
              </button>
            </div>
          </div>
        </div>
        
        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Base Rate:</span>
              <span>₹{formData.pricing.baseRate.toFixed(2)} × {formData.duration} hours = ₹{(formData.pricing.baseRate * formData.duration).toFixed(2)}</span>
            </div>
            
            {formData.pricing.equipmentCost > 0 && (
              <div className="flex justify-between">
                <span>Equipment:</span>
                <span>₹{formData.pricing.equipmentCost.toFixed(2)}</span>
              </div>
            )}
            
            {formData.pricing.additionalCharges.length > 0 && (
              <div className="flex justify-between">
                <span>Additional Charges:</span>
                <span>₹{formData.pricing.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0).toFixed(2)}</span>
              </div>
            )}
            
            {formData.pricing.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-₹{formData.pricing.discount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span>₹{formData.pricing.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Requirements */}
      <div>
        <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Requirements
        </label>
        <textarea
          id="requirements"
          name="requirements"
          value={formData.requirements}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        ></textarea>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || (!isAvailable && formData.status === 'confirmed')}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {loading ? 'Saving...' : booking ? 'Update Booking' : 'Create Booking'}
        </button>
      </div>
    </form>
  );
};

export default BookingForm;