import React, { useState } from 'react';
import InlineAddModal from './InlineAddModal';

const InlineAddModalDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Test fields with various types and validation
  const testFields = [
    {
      type: 'text',
      label: 'Full Name',
      name: 'fullName',
      required: true,
      placeholder: 'Enter your full name',
      minLength: 2,
      maxLength: 50,
      errorMessages: {
        required: 'Please enter your full name',
        minLength: 'Name must be at least 2 characters',
        maxLength: 'Name cannot exceed 50 characters'
      }
    },
    {
      type: 'email',
      label: 'Email Address',
      name: 'email',
      required: true,
      placeholder: 'Enter your email',
      errorMessages: {
        required: 'Email is required',
        invalid: 'Please enter a valid email address'
      }
    },
    {
      type: 'tel',
      label: 'Phone Number',
      name: 'phone',
      placeholder: 'Enter your phone number',
      help: 'Include country code if international'
    },
    {
      type: 'number',
      label: 'Age',
      name: 'age',
      min: 18,
      max: 120,
      placeholder: 'Enter your age',
      errorMessages: {
        min: 'You must be at least 18 years old',
        max: 'Please enter a valid age'
      }
    },
    {
      type: 'select',
      label: 'Department',
      name: 'department',
      required: true,
      placeholder: 'Select department',
      options: [
        { value: 'design', label: 'Graphic Design' },
        { value: 'video', label: 'Video Editing' },
        { value: 'events', label: 'Events' },
        { value: 'studio', label: 'Studio Booking' }
      ]
    },
    {
      type: 'multiselect',
      label: 'Skills',
      name: 'skills',
      placeholder: 'Select your skills',
      options: [
        { value: 'photoshop', label: 'Adobe Photoshop' },
        { value: 'illustrator', label: 'Adobe Illustrator' },
        { value: 'premiere', label: 'Adobe Premiere Pro' },
        { value: 'aftereffects', label: 'After Effects' },
        { value: 'photography', label: 'Photography' },
        { value: 'videography', label: 'Videography' }
      ],
      dependencies: ['department'],
      dependsOn: {
        department: ['design', 'video']
      }
    },
    {
      type: 'textarea',
      label: 'Additional Notes',
      name: 'notes',
      placeholder: 'Any additional information...',
      rows: 4,
      maxLength: 500
    },
    {
      type: 'date',
      label: 'Start Date',
      name: 'startDate',
      min: new Date().toISOString().split('T')[0], // Today or later
      help: 'When would you like to start?'
    },
    {
      type: 'checkbox',
      label: 'I agree to the terms and conditions',
      name: 'agreeToTerms',
      required: true,
      errorMessages: {
        required: 'You must agree to the terms and conditions'
      }
    }
  ];

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Form submitted with data:', data);
    alert('Form submitted successfully! Check console for data.');
    
    setIsSubmitting(false);
    setIsModalOpen(false);
    setFormData({});
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setFormData({});
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Enhanced InlineAddModal Demo</h1>
      
      <div className="space-y-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open Enhanced Modal
        </button>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Features being tested:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Multiple field types (text, email, tel, number, select, multiselect, textarea, date, checkbox)</li>
            <li>Field validation with custom error messages</li>
            <li>Field dependencies (Skills field only shows for Design/Video departments)</li>
            <li>Real-time validation feedback</li>
            <li>Loading states during submission</li>
            <li>Form data management</li>
            <li>Accessibility features</li>
          </ul>
        </div>
      </div>

      <InlineAddModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        title="Employee Registration"
        fields={testFields}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        submitButtonText="Register Employee"
        size="lg"
        icon={<span>👤</span>}
        iconColor="blue"
      />
    </div>
  );
};

export default InlineAddModalDemo;