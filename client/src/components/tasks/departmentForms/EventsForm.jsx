import React from 'react';
import PropTypes from 'prop-types';

/**
 * Events department-specific form fields
 * Includes location requirements, equipment needs, and production phases
 */
const EventsForm = ({ formData, onChange, errors = {} }) => {
  // Extract department-specific data with defaults
  const {
    departmentSpecific = {
      location: {
        name: '',
        address: '',
        indoorOutdoor: 'indoor',
        capacity: '',
        notes: ''
      },
      equipment: [],
      productionPhase: 'pre',
      vendors: [],
      eventType: ''
    }
  } = formData;

  // Handle changes to department-specific fields
  const handleDepartmentFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      onChange({
        target: {
          name: 'departmentSpecific',
          value: {
            ...departmentSpecific,
            [parent]: {
              ...departmentSpecific[parent],
              [child]: type === 'checkbox' ? checked : value
            }
          }
        }
      });
    } else {
      // Handle top-level fields
      onChange({
        target: {
          name: 'departmentSpecific',
          value: {
            ...departmentSpecific,
            [name]: type === 'checkbox' ? checked : value
          }
        }
      });
    }
  };

  // Handle equipment changes
  const handleEquipmentChange = (e) => {
    const equipmentText = e.target.value;
    const equipmentArray = equipmentText.split(',').map(item => item.trim()).filter(item => item);
    
    onChange({
      target: {
        name: 'departmentSpecific',
        value: {
          ...departmentSpecific,
          equipment: equipmentArray
        }
      }
    });
  };

  // Handle vendor changes
  const handleVendorChange = (e) => {
    const vendorText = e.target.value;
    const vendorArray = vendorText.split(',').map(item => item.trim()).filter(item => item);
    
    onChange({
      target: {
        name: 'departmentSpecific',
        value: {
          ...departmentSpecific,
          vendors: vendorArray
        }
      }
    });
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Events Requirements</h3>
      
      {/* Event Type */}
      <div className="mb-4">
        <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
          Event Type *
        </label>
        <select
          id="eventType"
          name="eventType"
          value={departmentSpecific.eventType}
          onChange={handleDepartmentFieldChange}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Event Type</option>
          <option value="corporate">Corporate Event</option>
          <option value="wedding">Wedding</option>
          <option value="concert">Concert/Performance</option>
          <option value="conference">Conference</option>
          <option value="social">Social Gathering</option>
          <option value="product_launch">Product Launch</option>
          <option value="other">Other</option>
        </select>
        {errors.eventType && (
          <p className="mt-1 text-sm text-red-600">{errors.eventType}</p>
        )}
      </div>
      
      {/* Production Phase */}
      <div className="mb-4">
        <label htmlFor="productionPhase" className="block text-sm font-medium text-gray-700 mb-1">
          Production Phase *
        </label>
        <select
          id="productionPhase"
          name="productionPhase"
          value={departmentSpecific.productionPhase}
          onChange={handleDepartmentFieldChange}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="pre">Pre-Production</option>
          <option value="production">Production</option>
          <option value="post">Post-Production</option>
        </select>
      </div>
      
      {/* Location Information */}
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-800 mb-2">Location Details</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Location Name */}
          <div>
            <label htmlFor="location.name" className="block text-sm font-medium text-gray-700 mb-1">
              Location Name *
            </label>
            <input
              type="text"
              id="location.name"
              name="location.name"
              value={departmentSpecific.location.name}
              onChange={handleDepartmentFieldChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Grand Hotel Ballroom"
            />
          </div>
          
          {/* Indoor/Outdoor */}
          <div>
            <label htmlFor="location.indoorOutdoor" className="block text-sm font-medium text-gray-700 mb-1">
              Indoor/Outdoor
            </label>
            <select
              id="location.indoorOutdoor"
              name="location.indoorOutdoor"
              value={departmentSpecific.location.indoorOutdoor}
              onChange={handleDepartmentFieldChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
              <option value="both">Both Indoor & Outdoor</option>
            </select>
          </div>
          
          {/* Address */}
          <div className="col-span-2">
            <label htmlFor="location.address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              id="location.address"
              name="location.address"
              value={departmentSpecific.location.address}
              onChange={handleDepartmentFieldChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full address of the venue"
            />
          </div>
          
          {/* Capacity */}
          <div>
            <label htmlFor="location.capacity" className="block text-sm font-medium text-gray-700 mb-1">
              Capacity (number of people)
            </label>
            <input
              type="number"
              id="location.capacity"
              name="location.capacity"
              value={departmentSpecific.location.capacity}
              onChange={handleDepartmentFieldChange}
              min="1"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 200"
            />
          </div>
          
          {/* Location Notes */}
          <div className="col-span-2">
            <label htmlFor="location.notes" className="block text-sm font-medium text-gray-700 mb-1">
              Location Notes
            </label>
            <textarea
              id="location.notes"
              name="location.notes"
              value={departmentSpecific.location.notes}
              onChange={handleDepartmentFieldChange}
              rows={2}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional information about the location (parking, access, etc.)"
            ></textarea>
          </div>
        </div>
      </div>
      
      {/* Equipment */}
      <div className="mb-4">
        <label htmlFor="equipment" className="block text-sm font-medium text-gray-700 mb-1">
          Equipment Needed (comma separated)
        </label>
        <textarea
          id="equipment"
          name="equipment"
          value={departmentSpecific.equipment.join(', ')}
          onChange={handleEquipmentChange}
          rows={2}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Cameras, Lighting, Sound System, Microphones"
        ></textarea>
        <p className="mt-1 text-xs text-gray-500">Separate items with commas</p>
      </div>
      
      {/* Vendors */}
      <div className="mb-4">
        <label htmlFor="vendors" className="block text-sm font-medium text-gray-700 mb-1">
          Vendors (comma separated)
        </label>
        <textarea
          id="vendors"
          name="vendors"
          value={departmentSpecific.vendors.join(', ')}
          onChange={handleVendorChange}
          rows={2}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Catering Company, AV Provider, Decorator"
        ></textarea>
        <p className="mt-1 text-xs text-gray-500">Separate vendor names with commas</p>
      </div>
    </div>
  );
};

EventsForm.propTypes = {
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object
};

export default EventsForm;