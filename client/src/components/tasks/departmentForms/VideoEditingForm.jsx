import React from 'react';
import PropTypes from 'prop-types';

/**
 * Video Editing department-specific form fields
 * Includes technical requirements, rendering progress, and asset management
 */
const VideoEditingForm = ({ formData, onChange, errors = {} }) => {
  // Extract department-specific data with defaults
  const {
    departmentSpecific = {
      technicalRequirements: {
        resolution: '1920x1080',
        format: 'mp4',
        frameRate: 30,
        duration: '',
        aspectRatio: '16:9'
      },
      renderingProgress: {
        status: 'not_started',
        percentage: 0,
        notes: ''
      },
      assets: {
        rawFootage: [],
        music: [],
        graphics: []
      },
      deliverables: [
        { format: 'mp4', resolution: '1920x1080', completed: false }
      ]
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

  // Handle changes to deliverable format
  const handleDeliverableChange = (index, field, value) => {
    const updatedDeliverables = [...departmentSpecific.deliverables];
    updatedDeliverables[index] = {
      ...updatedDeliverables[index],
      [field]: field === 'completed' ? value : value
    };
    
    onChange({
      target: {
        name: 'departmentSpecific',
        value: {
          ...departmentSpecific,
          deliverables: updatedDeliverables
        }
      }
    });
  };

  // Add a new deliverable format
  const addDeliverable = () => {
    onChange({
      target: {
        name: 'departmentSpecific',
        value: {
          ...departmentSpecific,
          deliverables: [
            ...departmentSpecific.deliverables,
            { format: 'mp4', resolution: '1920x1080', completed: false }
          ]
        }
      }
    });
  };

  // Remove a deliverable format
  const removeDeliverable = (index) => {
    const updatedDeliverables = [...departmentSpecific.deliverables];
    updatedDeliverables.splice(index, 1);
    
    onChange({
      target: {
        name: 'departmentSpecific',
        value: {
          ...departmentSpecific,
          deliverables: updatedDeliverables
        }
      }
    });
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Video Editing Requirements</h3>
      
      {/* Technical Requirements */}
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-800 mb-2">Technical Requirements</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Resolution */}
          <div>
            <label htmlFor="technicalRequirements.resolution" className="block text-sm font-medium text-gray-700 mb-1">
              Resolution *
            </label>
            <select
              id="technicalRequirements.resolution"
              name="technicalRequirements.resolution"
              value={departmentSpecific.technicalRequirements.resolution}
              onChange={handleDepartmentFieldChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1920x1080">Full HD (1920x1080)</option>
              <option value="3840x2160">4K UHD (3840x2160)</option>
              <option value="1280x720">HD (1280x720)</option>
              <option value="720x480">SD (720x480)</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          {/* Format */}
          <div>
            <label htmlFor="technicalRequirements.format" className="block text-sm font-medium text-gray-700 mb-1">
              Format *
            </label>
            <select
              id="technicalRequirements.format"
              name="technicalRequirements.format"
              value={departmentSpecific.technicalRequirements.format}
              onChange={handleDepartmentFieldChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mp4">MP4 (H.264)</option>
              <option value="mov">MOV (QuickTime)</option>
              <option value="avi">AVI</option>
              <option value="wmv">WMV</option>
              <option value="prores">ProRes</option>
              <option value="h265">MP4 (H.265/HEVC)</option>
            </select>
          </div>
          
          {/* Frame Rate */}
          <div>
            <label htmlFor="technicalRequirements.frameRate" className="block text-sm font-medium text-gray-700 mb-1">
              Frame Rate (fps)
            </label>
            <select
              id="technicalRequirements.frameRate"
              name="technicalRequirements.frameRate"
              value={departmentSpecific.technicalRequirements.frameRate}
              onChange={handleDepartmentFieldChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="24">24 fps (Film)</option>
              <option value="25">25 fps (PAL)</option>
              <option value="30">30 fps (Standard)</option>
              <option value="60">60 fps (High Frame Rate)</option>
              <option value="120">120 fps (Slow Motion)</option>
            </select>
          </div>
          
          {/* Duration */}
          <div>
            <label htmlFor="technicalRequirements.duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (MM:SS)
            </label>
            <input
              type="text"
              id="technicalRequirements.duration"
              name="technicalRequirements.duration"
              value={departmentSpecific.technicalRequirements.duration}
              onChange={handleDepartmentFieldChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 02:30"
              pattern="[0-9]{2}:[0-9]{2}"
            />
            <p className="mt-1 text-xs text-gray-500">Format: MM:SS (e.g., 02:30 for 2 minutes 30 seconds)</p>
          </div>
          
          {/* Aspect Ratio */}
          <div>
            <label htmlFor="technicalRequirements.aspectRatio" className="block text-sm font-medium text-gray-700 mb-1">
              Aspect Ratio
            </label>
            <select
              id="technicalRequirements.aspectRatio"
              name="technicalRequirements.aspectRatio"
              value={departmentSpecific.technicalRequirements.aspectRatio}
              onChange={handleDepartmentFieldChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="4:3">4:3 (Standard)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="9:16">9:16 (Vertical/Mobile)</option>
              <option value="2.35:1">2.35:1 (Cinemascope)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Rendering Progress */}
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-800 mb-2">Rendering Progress</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status */}
          <div>
            <label htmlFor="renderingProgress.status" className="block text-sm font-medium text-gray-700 mb-1">
              Rendering Status
            </label>
            <select
              id="renderingProgress.status"
              name="renderingProgress.status"
              value={departmentSpecific.renderingProgress.status}
              onChange={handleDepartmentFieldChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          {/* Percentage */}
          <div>
            <label htmlFor="renderingProgress.percentage" className="block text-sm font-medium text-gray-700 mb-1">
              Completion Percentage
            </label>
            <input
              type="number"
              id="renderingProgress.percentage"
              name="renderingProgress.percentage"
              value={departmentSpecific.renderingProgress.percentage}
              onChange={handleDepartmentFieldChange}
              min="0"
              max="100"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Notes */}
          <div className="col-span-2">
            <label htmlFor="renderingProgress.notes" className="block text-sm font-medium text-gray-700 mb-1">
              Rendering Notes
            </label>
            <textarea
              id="renderingProgress.notes"
              name="renderingProgress.notes"
              value={departmentSpecific.renderingProgress.notes}
              onChange={handleDepartmentFieldChange}
              rows={2}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any notes about the rendering process"
            ></textarea>
          </div>
        </div>
      </div>
      
      {/* Multiple Format Deliverables */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-md font-medium text-gray-800">Deliverable Formats</h4>
          <button
            type="button"
            onClick={addDeliverable}
            className="px-2 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Format
          </button>
        </div>
        
        {departmentSpecific.deliverables.map((deliverable, index) => (
          <div key={index} className="border rounded-md p-3 mb-3 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-sm font-medium text-gray-700">Format #{index + 1}</h5>
              {departmentSpecific.deliverables.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDeliverable(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  value={deliverable.format}
                  onChange={(e) => handleDeliverableChange(index, 'format', e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mp4">MP4 (H.264)</option>
                  <option value="mov">MOV (QuickTime)</option>
                  <option value="avi">AVI</option>
                  <option value="wmv">WMV</option>
                  <option value="prores">ProRes</option>
                  <option value="h265">MP4 (H.265/HEVC)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Resolution
                </label>
                <select
                  value={deliverable.resolution}
                  onChange={(e) => handleDeliverableChange(index, 'resolution', e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1920x1080">Full HD (1920x1080)</option>
                  <option value="3840x2160">4K UHD (3840x2160)</option>
                  <option value="1280x720">HD (1280x720)</option>
                  <option value="720x480">SD (720x480)</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`deliverable-${index}-completed`}
                  checked={deliverable.completed}
                  onChange={(e) => handleDeliverableChange(index, 'completed', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`deliverable-${index}-completed`} className="ml-2 block text-xs text-gray-700">
                  Completed
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

VideoEditingForm.propTypes = {
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object
};

export default VideoEditingForm;