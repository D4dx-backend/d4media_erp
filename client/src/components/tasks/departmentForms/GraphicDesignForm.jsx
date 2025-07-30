import React from 'react';
import PropTypes from 'prop-types';

/**
 * Graphic Design department-specific form fields
 * Includes design brief, format specifications, and revision tracking
 */
const GraphicDesignForm = ({ formData, onChange, errors = {} }) => {
  // Extract department-specific data with defaults
  const {
    departmentSpecific = {
      designBrief: '',
      formatSpecifications: {
        width: '',
        height: '',
        colorMode: 'rgb',
        fileFormat: 'png',
        resolution: 72
      },
      revisions: [],
      clientApproval: {
        required: false,
        status: 'pending',
        feedback: ''
      }
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

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Graphic Design Requirements</h3>
      
      {/* Design Brief */}
      <div className="mb-4">
        <label htmlFor="designBrief" className="block text-sm font-medium text-gray-700 mb-1">
          Design Brief *
        </label>
        <textarea
          id="designBrief"
          name="designBrief"
          value={departmentSpecific.designBrief}
          onChange={handleDepartmentFieldChange}
          rows={4}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Detailed description of design requirements, target audience, and goals"
          required
        ></textarea>
        {errors.designBrief && (
          <p className="mt-1 text-sm text-red-600">{errors.designBrief}</p>
        )}
      </div>
      
      {/* Format Specifications */}
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-800 mb-2">Format Specifications</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dimensions */}
          <div>
            <label htmlFor="formatSpecifications.width" className="block text-sm font-medium text-gray-700 mb-1">
              Width (px)
            </label>
            <input
              type="number"
              id="formatSpecifications.width"
              name="formatSpecifications.width"
              value={departmentSpecific.formatSpecifications.width}
              onChange={handleDepartmentFieldChange}
              min="1"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1920"
            />
          </div>
          
          <div>
            <label htmlFor="formatSpecifications.height" className="block text-sm font-medium text-gray-700 mb-1">
              Height (px)
            </label>
            <input
              type="number"
              id="formatSpecifications.height"
              name="formatSpecifications.height"
              value={departmentSpecific.formatSpecifications.height}
              onChange={handleDepartmentFieldChange}
              min="1"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1080"
            />
          </div>
          
          {/* Color Mode */}
          <div>
            <label htmlFor="formatSpecifications.colorMode" className="block text-sm font-medium text-gray-700 mb-1">
              Color Mode
            </label>
            <select
              id="formatSpecifications.colorMode"
              name="formatSpecifications.colorMode"
              value={departmentSpecific.formatSpecifications.colorMode}
              onChange={handleDepartmentFieldChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rgb">RGB</option>
              <option value="cmyk">CMYK</option>
              <option value="grayscale">Grayscale</option>
            </select>
          </div>
          
          {/* File Format */}
          <div>
            <label htmlFor="formatSpecifications.fileFormat" className="block text-sm font-medium text-gray-700 mb-1">
              File Format
            </label>
            <select
              id="formatSpecifications.fileFormat"
              name="formatSpecifications.fileFormat"
              value={departmentSpecific.formatSpecifications.fileFormat}
              onChange={handleDepartmentFieldChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="pdf">PDF</option>
              <option value="ai">AI</option>
              <option value="psd">PSD</option>
              <option value="svg">SVG</option>
            </select>
          </div>
          
          {/* Resolution */}
          <div>
            <label htmlFor="formatSpecifications.resolution" className="block text-sm font-medium text-gray-700 mb-1">
              Resolution (DPI)
            </label>
            <select
              id="formatSpecifications.resolution"
              name="formatSpecifications.resolution"
              value={departmentSpecific.formatSpecifications.resolution}
              onChange={handleDepartmentFieldChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="72">72 DPI (Web)</option>
              <option value="150">150 DPI (Medium Quality Print)</option>
              <option value="300">300 DPI (High Quality Print)</option>
              <option value="600">600 DPI (Professional Print)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Client Approval */}
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-800 mb-2">Client Approval</h4>
        
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="clientApproval.required"
            name="clientApproval.required"
            checked={departmentSpecific.clientApproval.required}
            onChange={handleDepartmentFieldChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="clientApproval.required" className="ml-2 block text-sm text-gray-700">
            Require client approval
          </label>
        </div>
        
        {departmentSpecific.clientApproval.required && (
          <div>
            <label htmlFor="clientApproval.status" className="block text-sm font-medium text-gray-700 mb-1">
              Approval Status
            </label>
            <select
              id="clientApproval.status"
              name="clientApproval.status"
              value={departmentSpecific.clientApproval.status}
              onChange={handleDepartmentFieldChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="revision_requested">Revision Requested</option>
            </select>
            
            {departmentSpecific.clientApproval.status === 'rejected' || 
             departmentSpecific.clientApproval.status === 'revision_requested' ? (
              <div className="mt-2">
                <label htmlFor="clientApproval.feedback" className="block text-sm font-medium text-gray-700 mb-1">
                  Client Feedback
                </label>
                <textarea
                  id="clientApproval.feedback"
                  name="clientApproval.feedback"
                  value={departmentSpecific.clientApproval.feedback}
                  onChange={handleDepartmentFieldChange}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Client feedback for revisions"
                ></textarea>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

GraphicDesignForm.propTypes = {
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object
};

export default GraphicDesignForm;