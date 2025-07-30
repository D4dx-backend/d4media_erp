import React, { useState, useEffect } from 'react';
import equipmentService from '../../services/equipmentService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const EquipmentManagement = () => {
  const { user, token } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    status: 'active',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    category: 'audio',
    description: '',
    specifications: '',
    pricing: {
      studio: {
        dailyRate: '',
        hourlyRate: ''
      },
      event: {
        dailyRate: '',
        hourlyRate: ''
      },
      rental: {
        dailyRate: '',
        hourlyRate: '',
        weeklyRate: '',
        monthlyRate: ''
      }
    },
    availableQuantity: 1,
    usageType: ['studio', 'event', 'rental'],
    tags: ''
  });

  // Predefined tag suggestions
  const suggestedTags = [
    'audio', 'studio', 'event', 'rental', 'microphone', 'speaker', 'camera',
    'lighting', 'video', 'streaming', 'wireless', 'professional', 'portable',
    'recording', 'broadcast', 'conference', 'presentation', 'photography',
    'live', 'digital', 'analog', 'mixer', 'amplifier', 'monitor'
  ];

  const categories = [
    { value: 'audio', label: 'Audio Equipment' },
    { value: 'video', label: 'Video Equipment' },
    { value: 'lighting', label: 'Lighting Equipment' },
    { value: 'presentation', label: 'Presentation Equipment' },
    { value: 'streaming', label: 'Streaming Equipment' },
    { value: 'accessories', label: 'Accessories' }
  ];

  // Fetch equipment data
  const fetchEquipment = async () => {
    try {
      console.log('Starting to fetch equipment...');
      setLoading(true);

      // Build query parameters
      const queryParams = {
        ...filters,
        search: searchQuery,
        _t: new Date().getTime() // Cache buster
      };

      console.log('Query params:', queryParams);
      const response = await equipmentService.getAllEquipment(queryParams);
      console.log('Equipment response:', response); // Debug log

      // Handle different possible response formats
      if (response && response.success && Array.isArray(response.data)) {
        // Standard API response format with data property
        setEquipment(response.data);
        setPagination(response.pagination || {});
      } else if (response && Array.isArray(response)) {
        // Direct array response
        setEquipment(response);
        setPagination({});
      } else if (response && Array.isArray(response.equipment)) {
        // Nested equipment property
        setEquipment(response.equipment);
        setPagination(response.pagination || {});
      } else if (response && response.count !== undefined && Array.isArray(response.data)) {
        // Format with count and data properties
        setEquipment(response.data);
        setPagination(response.pagination || {});
      } else {
        console.error('Failed to parse equipment data:', response);
        setEquipment([]);
        setPagination({});
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setEquipment([]);
      
      // Show user-friendly error message
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. You do not have permission to view equipment.');
      } else {
        toast.error('Failed to load equipment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      console.log('useEffect triggered, calling fetchEquipment');
      fetchEquipment();
    }
  }, [filters, searchQuery, user, token]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    // Handle nested pricing fields
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          [section]: {
            ...prev.pricing[section],
            [field]: type === 'number' ? parseFloat(value) || 0 : value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      }));
    }
  };

  // Handle tag suggestion click
  const handleTagSuggestionClick = (tag) => {
    const currentTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ');
      setFormData(prev => ({
        ...prev,
        tags: newTags
      }));
    }
  };

  // Remove tag from input
  const removeTag = (tagToRemove) => {
    const currentTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    const newTags = currentTags.filter(tag => tag !== tagToRemove).join(', ');
    setFormData(prev => ({
      ...prev,
      tags: newTags
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const equipmentData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      let response;
      if (editingEquipment) {
        response = await equipmentService.updateEquipment(editingEquipment._id || editingEquipment.id, equipmentData);
      } else {
        response = await equipmentService.createEquipment(equipmentData);
        console.log('Equipment created response:', response); // Debug log
      }

      if (response.success) {
        toast.success(`Equipment ${editingEquipment ? 'updated' : 'created'} successfully!`);
        setShowForm(false);
        setEditingEquipment(null);
        setFormData({
          name: '',
          category: 'audio',
          description: '',
          specifications: '',
          pricing: {
            studio: {
              dailyRate: '',
              hourlyRate: ''
            },
            event: {
              dailyRate: '',
              hourlyRate: ''
            },
            rental: {
              dailyRate: '',
              hourlyRate: '',
              weeklyRate: '',
              monthlyRate: ''
            }
          },
          availableQuantity: 1,
          usageType: ['studio', 'event', 'rental'],
          tags: ''
        });

        // Add a small delay before fetching equipment to ensure the server has processed the change
        setTimeout(() => {
          fetchEquipment();
        }, 500);
      } else {
        // Handle validation errors
        if (response.errors && Array.isArray(response.errors)) {
          // Show each validation error as a separate toast
          response.errors.forEach(error => {
            toast.error(error);
          });
        } else {
          // Show generic error message
          toast.error(response.error || `Failed to ${editingEquipment ? 'update' : 'create'} equipment`);
        }
      }
    } catch (error) {
      console.error('Error submitting equipment:', error);
      toast.error(`Failed to ${editingEquipment ? 'update' : 'create'} equipment`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (item) => {
    setEditingEquipment(item);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description || '',
      specifications: item.specifications || '',
      pricing: {
        studio: {
          dailyRate: item.pricing?.studio?.dailyRate || '',
          hourlyRate: item.pricing?.studio?.hourlyRate || ''
        },
        event: {
          dailyRate: item.pricing?.event?.dailyRate || '',
          hourlyRate: item.pricing?.event?.hourlyRate || ''
        },
        rental: {
          dailyRate: item.pricing?.rental?.dailyRate || '',
          hourlyRate: item.pricing?.rental?.hourlyRate || '',
          weeklyRate: item.pricing?.rental?.weeklyRate || '',
          monthlyRate: item.pricing?.rental?.monthlyRate || ''
        }
      },
      availableQuantity: item.availableQuantity,
      usageType: item.usageType || ['studio', 'event', 'rental'],
      tags: item.tags ? item.tags.join(', ') : ''
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        const response = await equipmentService.deleteEquipment(item._id || item.id);
        if (response.success) {
          toast.success('Equipment deleted successfully!');
          fetchEquipment();
        } else {
          toast.error(response.error || 'Failed to delete equipment');
        }
      } catch (error) {
        console.error('Error deleting equipment:', error);
        toast.error('Failed to delete equipment');
      }
    }
  };

  // Removed seed data function

  console.log('Rendering EquipmentManagement, loading:', loading, 'equipment count:', equipment.length);
  console.log('User:', user, 'Token:', !!token);

  // Show authentication error if not logged in
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Authentication Required</h2>
            <p className="text-yellow-600">Please log in to access equipment management.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipment Management</h1>
          <p className="text-gray-600 mt-2">
            Manage studio equipment and pricing for bookings.
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingEquipment(null);
              setFormData({
                name: '',
                category: 'audio',
                description: '',
                specifications: '',
                pricing: {
                  studio: {
                    dailyRate: '',
                    hourlyRate: ''
                  },
                  event: {
                    dailyRate: '',
                    hourlyRate: ''
                  },
                  rental: {
                    dailyRate: '',
                    hourlyRate: '',
                    weeklyRate: '',
                    monthlyRate: ''
                  }
                },
                availableQuantity: 1,
                usageType: ['studio', 'event', 'rental'],
                tags: ''
              });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Equipment
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Equipment
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, description, or tags..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Items per page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Equipment Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter equipment name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="col-span-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Information</h3>

              {/* Studio Pricing */}
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h4 className="text-md font-medium text-gray-800 mb-3">Studio Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Studio Daily Rate (₹) *
                    </label>
                    <input
                      type="number"
                      name="studio.dailyRate"
                      value={formData.pricing.studio.dailyRate}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Studio Hourly Rate (₹)
                    </label>
                    <input
                      type="number"
                      name="studio.hourlyRate"
                      value={formData.pricing.studio.hourlyRate}
                      onChange={handleInputChange}
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Event Pricing */}
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h4 className="text-md font-medium text-gray-800 mb-3">Event Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Daily Rate (₹) *
                    </label>
                    <input
                      type="number"
                      name="event.dailyRate"
                      value={formData.pricing.event.dailyRate}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Hourly Rate (₹)
                    </label>
                    <input
                      type="number"
                      name="event.hourlyRate"
                      value={formData.pricing.event.hourlyRate}
                      onChange={handleInputChange}
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Rental Pricing */}
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h4 className="text-md font-medium text-gray-800 mb-3">Rental Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rental Daily Rate (₹) *
                    </label>
                    <input
                      type="number"
                      name="rental.dailyRate"
                      value={formData.pricing.rental.dailyRate}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rental Hourly Rate (₹)
                    </label>
                    <input
                      type="number"
                      name="rental.hourlyRate"
                      value={formData.pricing.rental.hourlyRate}
                      onChange={handleInputChange}
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weekly Rate (₹)
                    </label>
                    <input
                      type="number"
                      name="rental.weeklyRate"
                      value={formData.pricing.rental.weeklyRate}
                      onChange={handleInputChange}
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Rate (₹)
                    </label>
                    <input
                      type="number"
                      name="rental.monthlyRate"
                      value={formData.pricing.rental.monthlyRate}
                      onChange={handleInputChange}
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Quantity *
                </label>
                <input
                  type="number"
                  name="availableQuantity"
                  value={formData.availableQuantity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="audio, microphone, wireless"
                />
                {/* Current Tags Display */}
                {formData.tags && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Tag Suggestions */}
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Suggested tags (click to add):</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map((tag) => {
                      const currentTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
                      const isSelected = currentTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagSuggestionClick(tag)}
                          disabled={isSelected}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${isSelected
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                            }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Equipment description..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specifications
              </label>
              <textarea
                name="specifications"
                value={formData.specifications}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Technical specifications..."
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingEquipment(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingEquipment ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Equipment List */}
      {loading && !showForm ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Equipment List ({pagination.total || equipment.length})
              {searchQuery && <span className="text-sm text-gray-500 ml-2">- Filtered by "{searchQuery}"</span>}
            </h2>
          </div>
          {equipment.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No equipment found. Click "Add Equipment" to create new equipment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pricing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {equipment.map((item) => (
                    <tr key={item._id || item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div>Studio: ₹{item.pricing?.studio?.dailyRate || 0}/day</div>
                          <div>Event: ₹{item.pricing?.event?.dailyRate || 0}/day</div>
                          <div>Rental: ₹{item.pricing?.rental?.dailyRate || 0}/day</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.availableQuantity}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.tags && item.tags.length > 0 ? (
                            item.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">No tags</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                    <span className="font-medium">{pagination.totalPages}</span>
                    {pagination.total && (
                      <span> ({pagination.total} total items)</span>
                    )}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default EquipmentManagement;