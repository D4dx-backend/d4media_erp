import React, { useState } from 'react';
import FormField from './FormField';

const FormFieldDemo = () => {
  const [formData, setFormData] = useState({
    department: '',
    taskType: '',
    assignedTo: '',
    client: '',
    priority: '',
    estimatedHours: ''
  });

  // Sample data for dropdowns
  const departments = [
    { value: 'graphic-design', label: 'Graphic Design' },
    { value: 'video-editing', label: 'Video Editing' },
    { value: 'events', label: 'Events' },
    { value: 'studio', label: 'Studio' },
    { value: 'google-services', label: 'Google Services' },
    { value: 'zoom-services', label: 'Zoom Services' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'web-development', label: 'Web Development' },
    { value: 'social-media', label: 'Social Media' },
    { value: 'content-writing', label: 'Content Writing' }
  ];

  const taskTypes = [
    { value: 'logo-design', label: 'Logo Design' },
    { value: 'brochure', label: 'Brochure Design' },
    { value: 'video-edit', label: 'Video Editing' },
    { value: 'event-planning', label: 'Event Planning' },
    { value: 'photoshoot', label: 'Photo Shoot' },
    { value: 'website', label: 'Website Development' },
    { value: 'social-post', label: 'Social Media Post' },
    { value: 'blog-post', label: 'Blog Post Writing' }
  ];

  const assignees = [
    { value: 'john-doe', label: 'John Doe' },
    { value: 'jane-smith', label: 'Jane Smith' },
    { value: 'mike-johnson', label: 'Mike Johnson' },
    { value: 'sarah-wilson', label: 'Sarah Wilson' },
    { value: 'david-brown', label: 'David Brown' },
    { value: 'lisa-davis', label: 'Lisa Davis' },
    { value: 'tom-miller', label: 'Tom Miller' },
    { value: 'amy-garcia', label: 'Amy Garcia' }
  ];

  const clients = [
    { value: 'acme-corp', label: 'Acme Corporation' },
    { value: 'tech-solutions', label: 'Tech Solutions Inc' },
    { value: 'green-energy', label: 'Green Energy Co' },
    { value: 'food-delights', label: 'Food Delights Restaurant' },
    { value: 'fashion-forward', label: 'Fashion Forward Boutique' },
    { value: 'health-plus', label: 'Health Plus Clinic' },
    { value: 'auto-world', label: 'Auto World Dealership' },
    { value: 'edu-center', label: 'Education Center' }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const handleFieldChange = (fieldName) => (event) => {
    const value = event.target ? event.target.value : event;
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleAddNew = async (fieldName, newValue) => {
    // Simulate adding new item
    console.log(`Adding new ${fieldName}:`, newValue);
    
    // For demo purposes, just add it to the form data
    const newOption = {
      value: newValue.toLowerCase().replace(/\s+/g, '-'),
      label: newValue
    };
    
    // In real app, you would make an API call here
    // await api.addNewOption(fieldName, newOption);
    
    // Update form data with new selection
    setFormData(prev => ({
      ...prev,
      [fieldName]: newOption.value
    }));
    
    return newOption;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Enhanced Form Fields Demo</h2>
      <p className="text-gray-600 mb-8">
        This demo shows the enhanced FormField component with search functionality. 
        Dropdowns with more than 10 options automatically get search capability, 
        or you can explicitly enable it with the `searchable` prop.
      </p>

      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Department - Searchable because it has more than 10 options */}
          <FormField
            type="select"
            name="department"
            label="Department"
            value={formData.department}
            onChange={handleFieldChange('department')}
            options={departments}
            placeholder="Select Department"
            required
            tooltip="Choose the department responsible for this task"
            onAdd={(newValue) => handleAddNew('department', newValue)}
          />

          {/* Task Type - Explicitly searchable */}
          <FormField
            type="select"
            name="taskType"
            label="Task Type"
            value={formData.taskType}
            onChange={handleFieldChange('taskType')}
            options={taskTypes}
            placeholder="Select Task Type"
            searchable={true}
            required
            tooltip="Specify the type of task to be performed"
            onAdd={(newValue) => handleAddNew('taskType', newValue)}
          />

          {/* Assigned To - Searchable */}
          <FormField
            type="select"
            name="assignedTo"
            label="Assigned To"
            value={formData.assignedTo}
            onChange={handleFieldChange('assignedTo')}
            options={assignees}
            placeholder="Select Assignee"
            searchable={true}
            tooltip="Choose who will be responsible for this task"
          />

          {/* Client - Searchable */}
          <FormField
            type="select"
            name="client"
            label="Client"
            value={formData.client}
            onChange={handleFieldChange('client')}
            options={clients}
            placeholder="Select Client"
            searchable={true}
            required
            tooltip="Select the client for whom this task is being performed"
            onAdd={(newValue) => handleAddNew('client', newValue)}
          />

          {/* Priority - Regular dropdown (less than 10 options) */}
          <FormField
            type="select"
            name="priority"
            label="Priority"
            value={formData.priority}
            onChange={handleFieldChange('priority')}
            options={priorities}
            placeholder="Select Priority"
            required
            tooltip="Set the priority level for this task"
          />

          {/* Estimated Hours - Number input with validation */}
          <FormField
            type="number"
            name="estimatedHours"
            label="Estimated Hours"
            value={formData.estimatedHours}
            onChange={handleFieldChange('estimatedHours')}
            placeholder="Enter estimated hours"
            min={0.5}
            max={100}
            step={0.5}
            required
            validationRules={{
              min: 0.5,
              max: 100
            }}
            tooltip="Estimate how many hours this task will take"
            help="Enter a value between 0.5 and 100 hours"
          />
        </div>

        {/* Form Data Display */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Current Form Data:</h3>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-900">Try These Features:</h3>
          <ul className="list-disc list-inside space-y-2 text-blue-800">
            <li>Type in the Department dropdown to search through options</li>
            <li>Try typing partial matches or even with typos - fuzzy search will find matches</li>
            <li>Type something that doesn't exist and click "Add New" to add it</li>
            <li>Use keyboard navigation (arrow keys, Enter, Escape) in dropdowns</li>
            <li>Notice validation icons appear after you interact with fields</li>
            <li>Hover over the help icons (?) to see tooltips</li>
            <li>Try entering invalid values in the Estimated Hours field</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default FormFieldDemo;