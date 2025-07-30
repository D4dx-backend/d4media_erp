import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking, checkAvailability, getAvailableTimeSlots, getEquipmentOptions } from '../../services/eventService';
import { getUsers } from '../../services/userService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EventBooking = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    // Client Selection
    client: '',
    useExistingClient: false,
    // Event Details
    eventType: '',
    eventTitle: '',
    eventDescription: '',
    
    // Date & Time
    bookingDate: '',
    timeSlot: {
      startTime: '',
      endTime: ''
    },
    
    // Contact Information
    contactPerson: {
      name: '',
      email: '',
      phone: '',
      company: ''
    },
    
    // Event Requirements
    equipment: [],
    specialRequirements: '',
    cateringNeeded: false,
    cateringDetails: '',
    
    // Setup Requirements
    setupTime: '1', // hours before event
    cleanupTime: '1', // hours after event
    
    // Additional Services
    photographyNeeded: false,
    videographyNeeded: false,
    liveStreamingNeeded: false,
    
    // Budget
    estimatedBudget: '',
    
    // Notes
    additionalNotes: ''
  });

  const eventTypes = [
    'Corporate Meeting',
    'Product Launch',
    'Workshop/Training',
    'Conference',
    'Webinar Recording',
    'Interview/Podcast',
    'Photo Shoot',
    'Video Production',
    'Live Streaming Event',
    'Other'
  ];

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch clients
        setClientsLoading(true);
        const clientsResponse = await getUsers({ role: 'client' });
        console.log('Clients response:', clientsResponse);
        if (clientsResponse.success && clientsResponse.data) {
          setClients(clientsResponse.data);
        } else {
          console.error('Failed to fetch clients:', clientsResponse.error);
          setClients([]);
        }
        
        // Fetch equipment options
        setEquipmentLoading(true);
        const response = await getEquipmentOptions({ tags: ['event'] });
        if (response.success && response.data) {
          setEquipmentOptions(response.data);
        } else {
          console.error('Failed to fetch equipment options:', response.error);
          setEquipmentOptions([]);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setEquipmentOptions([]);
        setClients([]);
      } finally {
        setEquipmentLoading(false);
        setClientsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle equipment selection
  const handleEquipmentChange = (equipmentId) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipmentId)
        ? prev.equipment.filter(id => id !== equipmentId)
        : [...prev.equipment, equipmentId]
    }));
  };

  // Fetch available time slots when date changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (formData.bookingDate) {
        try {
          setLoading(true);
          const response = await getAvailableTimeSlots(formData.bookingDate);
          if (response.success && response.data) {
            setAvailableSlots(response.data);
          } else {
            setAvailableSlots([]);
          }
        } catch (error) {
          console.error('Error fetching available slots:', error);
          setAvailableSlots([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAvailableSlots();
  }, [formData.bookingDate]);

  // Calculate total estimated cost
  const calculateEstimatedCost = () => {
    let baseCost = 5000; // Base studio rental cost in rupees
    let equipmentCost = 0;
    
    formData.equipment.forEach(equipmentId => {
      const equipment = equipmentOptions.find(eq => eq.id === equipmentId);
      if (equipment) {
        equipmentCost += equipment.dailyRate || equipment.price || 0;
      }
    });

    // Add setup and cleanup time costs (in rupees)
    const setupCost = parseInt(formData.setupTime) * 1000;
    const cleanupCost = parseInt(formData.cleanupTime) * 1000;
    
    return baseCost + equipmentCost + setupCost + cleanupCost;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.eventTitle || !formData.bookingDate || !formData.timeSlot.startTime || 
          (!formData.useExistingClient && (!formData.contactPerson.name || !formData.contactPerson.email)) ||
          (formData.useExistingClient && !formData.client)) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Check availability
      const availabilityCheck = await checkAvailability(
        formData.bookingDate,
        formData.timeSlot.startTime,
        formData.timeSlot.endTime
      );

      if (!availabilityCheck.success || !availabilityCheck.available) {
        toast.error('Selected time slot is not available. Please choose another time.');
        return;
      }

      // Prepare booking data
      const bookingData = {
        ...formData,
        purpose: `${formData.eventType}: ${formData.eventTitle}`,
        status: 'inquiry',
        pricing: {
          baseRate: 200,
          equipmentCost: formData.equipment.reduce((sum, equipmentId) => {
            const equipment = equipmentOptions.find(eq => eq.id === equipmentId);
            return sum + (equipment ? (equipment.dailyRate || equipment.price || 0) : 0);
          }, 0),
          setupCost: parseInt(formData.setupTime) * 50,
          cleanupCost: parseInt(formData.cleanupTime) * 50,
          totalAmount: calculateEstimatedCost()
        }
      };

      // Submit booking
      const response = await createBooking(bookingData);

      if (response.success) {
        toast.success('Event booking request submitted successfully! We will contact you shortly.');
        navigate('/studio');
      } else {
        toast.error(response.error || 'Failed to submit booking request');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Failed to submit booking request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Book Event</h1>
        <p className="text-gray-600 mt-2">
          Complete the form below to request an event booking. We'll review your request and get back to you within 24 hours.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Information</h2>
          <div className="mb-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="useExistingClient"
                  checked={!formData.useExistingClient}
                  onChange={() => setFormData(prev => ({ ...prev, useExistingClient: false, client: '' }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">New Client</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="useExistingClient"
                  checked={formData.useExistingClient}
                  onChange={() => setFormData(prev => ({ ...prev, useExistingClient: true }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Existing Client</span>
              </label>
            </div>
          </div>
          
          {formData.useExistingClient && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Client *
              </label>
              {clientsLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="small" />
                </div>
              ) : (
                <select
                  name="client"
                  value={formData.client}
                  onChange={handleInputChange}
                  required={formData.useExistingClient}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.name} - {client.email}
                      {client.company && ` (${client.company})`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Event Type (Optional)</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              name="eventTitle"
              value={formData.eventTitle}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event title"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Description
            </label>
            <textarea
              name="eventDescription"
              value={formData.eventDescription}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your event..."
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Date & Time</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Date *
              </label>
              <input
                type="date"
                name="bookingDate"
                value={formData.bookingDate}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <select
                name="timeSlot.startTime"
                value={formData.timeSlot.startTime}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Start Time</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const hour = i + 8; // 8 AM to 7 PM
                  return (
                    <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                      {hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <select
                name="timeSlot.endTime"
                value={formData.timeSlot.endTime}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select End Time</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const hour = i + 9; // 9 AM to 8 PM
                  return (
                    <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                      {hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Setup Time (hours before event)
              </label>
              <select
                name="setupTime"
                value={formData.setupTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">No setup time needed</option>
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="3">3 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cleanup Time (hours after event)
              </label>
              <select
                name="cleanupTime"
                value={formData.cleanupTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">No cleanup time needed</option>
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="3">3 hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="contactPerson.name"
                value={formData.contactPerson.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="contactPerson.email"
                value={formData.contactPerson.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="contactPerson.phone"
                value={formData.contactPerson.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company/Organization
              </label>
              <input
                type="text"
                name="contactPerson.company"
                value={formData.contactPerson.company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Company name"
              />
            </div>
          </div>
        </div>

        {/* Equipment & Services */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Equipment & Services</h2>
          {equipmentLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {equipmentOptions.map(equipment => (
                <label key={equipment.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.equipment.includes(equipment.id)}
                    onChange={() => handleEquipmentChange(equipment.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{equipment.name}</div>
                    <div className="text-sm text-gray-500">
                      ₹{equipment.dailyRate || equipment.price || 0}/day
                      {equipment.category && (
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-xs rounded">
                          {equipment.category}
                        </span>
                      )}
                    </div>
                    {equipment.description && (
                      <div className="text-xs text-gray-400 mt-1">{equipment.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="cateringNeeded"
                checked={formData.cateringNeeded}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">Catering Services Needed</label>
            </div>
            {formData.cateringNeeded && (
              <textarea
                name="cateringDetails"
                value={formData.cateringDetails}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your catering requirements..."
              />
            )}
          </div>
        </div>

        {/* Additional Requirements */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Requirements</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requirements
              </label>
              <textarea
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special setup, accessibility needs, or other requirements..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any other information we should know..."
              />
            </div>
          </div>
        </div>

        {/* Cost Estimate */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Estimated Cost</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base Studio Rental:</span>
              <span>₹5,000.00</span>
            </div>
            <div className="flex justify-between">
              <span>Equipment ({formData.equipment.length} items):</span>
              <span>₹{formData.equipment.reduce((sum, equipmentId) => {
                const equipment = equipmentOptions.find(eq => eq.id === equipmentId);
                return sum + (equipment ? (equipment.dailyRate || equipment.price || 0) : 0);
              }, 0).toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between">
              <span>Setup Time ({formData.setupTime}h × ₹1,000):</span>
              <span>₹{(parseInt(formData.setupTime) * 1000).toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between">
              <span>Cleanup Time ({formData.cleanupTime}h × ₹1,000):</span>
              <span>₹{(parseInt(formData.cleanupTime) * 1000).toLocaleString()}.00</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>Total Estimated Cost:</span>
              <span>₹{calculateEstimatedCost().toLocaleString()}.00</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            * This is an estimate. Final pricing will be confirmed after review.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/studio')}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {loading && <LoadingSpinner size="small" className="mr-2" />}
            Submit Booking Request
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventBooking;