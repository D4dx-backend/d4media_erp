import React from 'react';
import PropTypes from 'prop-types';
import GraphicDesignForm from './departmentForms/GraphicDesignForm';
import VideoEditingForm from './departmentForms/VideoEditingForm';
import EventsForm from './departmentForms/EventsForm';

/**
 * Component that renders the appropriate department-specific form based on department code
 */
const DepartmentTaskForm = ({ departmentCode, formData, onChange, errors = {} }) => {
  // Return the appropriate form based on department code
  switch (departmentCode) {
    case 'DESIGN':
      return (
        <GraphicDesignForm 
          formData={formData} 
          onChange={onChange} 
          errors={errors} 
        />
      );
    case 'VIDEO':
      return (
        <VideoEditingForm 
          formData={formData} 
          onChange={onChange} 
          errors={errors} 
        />
      );
    case 'EVENTS':
      return (
        <EventsForm 
          formData={formData} 
          onChange={onChange} 
          errors={errors} 
        />
      );
    default:
      return null; // No department-specific form for this department
  }
};

DepartmentTaskForm.propTypes = {
  departmentCode: PropTypes.string.isRequired,
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object
};

export default DepartmentTaskForm;