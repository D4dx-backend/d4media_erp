import React, { useState, useEffect, useRef } from 'react';
import TouchButton from './TouchButton';
import FormField from './FormField';

const InlineAddModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields = [],
  submitButtonText = 'Add',
  cancelButtonText = 'Cancel',
  size = 'md',
  icon,
  iconColor = 'blue',
  isSubmitting = false,
  formData = {},
  setFormData,
  validationErrors = {},
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  autoFocus = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  onOpen,
  onAfterOpen,
  onAfterClose,
  preventScroll = true,
  ...props
}) => {
  const [internalFormData, setInternalFormData] = useState({});
  const [internalErrors, setInternalErrors] = useState({});
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Use internal state if no external state management is provided
  const currentFormData = setFormData ? formData : internalFormData;
  const currentErrors = Object.keys(validationErrors).length > 0 ? validationErrors : internalErrors;
  const setCurrentFormData = setFormData || setInternalFormData;
  const setCurrentErrors = Object.keys(validationErrors).length > 0 ? () => {} : setInternalErrors;

  // Size configurations
  const sizeConfig = {
    sm: {
      maxWidth: 'max-w-sm',
      padding: 'p-4',
      titleSize: 'text-lg',
      spacing: 'space-y-3'
    },
    md: {
      maxWidth: 'max-w-md',
      padding: 'p-6',
      titleSize: 'text-lg',
      spacing: 'space-y-4'
    },
    lg: {
      maxWidth: 'max-w-lg',
      padding: 'p-6',
      titleSize: 'text-xl',
      spacing: 'space-y-4'
    },
    xl: {
      maxWidth: 'max-w-xl',
      padding: 'p-8',
      titleSize: 'text-xl',
      spacing: 'space-y-5'
    },
    '2xl': {
      maxWidth: 'max-w-2xl',
      padding: 'p-8',
      titleSize: 'text-2xl',
      spacing: 'space-y-6'
    }
  };

  const currentSizeConfig = sizeConfig[size] || sizeConfig.md;

  // Icon color configurations
  const iconColorConfig = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    pink: 'bg-pink-100 text-pink-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  const currentIconColor = iconColorConfig[iconColor] || iconColorConfig.blue;

  // Initialize form data with default values
  useEffect(() => {
    if (isOpen && fields.length > 0) {
      const initialData = {};
      fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          initialData[field.name] = field.defaultValue;
        } else if (field.type === 'checkbox') {
          initialData[field.name] = false;
        } else if (field.type === 'multiselect') {
          initialData[field.name] = [];
        } else {
          initialData[field.name] = '';
        }
      });
      
      // Only set initial data if form data is empty
      if (Object.keys(currentFormData).length === 0) {
        setCurrentFormData(initialData);
      }
    }
  }, [isOpen, fields]);

  // Handle modal open/close effects
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement;
      
      // Prevent body scroll if requested
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
      }
      
      // Call onOpen callback
      if (onOpen) {
        onOpen();
      }
      
      // Call onAfterOpen callback after a short delay
      const timer = setTimeout(() => {
        if (onAfterOpen) {
          onAfterOpen();
        }
        
        // Auto focus first input
        if (autoFocus && firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      // Restore body scroll
      if (preventScroll) {
        document.body.style.overflow = '';
      }
      
      // Restore focus to previously active element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      
      // Call onAfterClose callback
      if (onAfterClose) {
        onAfterClose();
      }
    }
  }, [isOpen, preventScroll, onOpen, onAfterOpen, onAfterClose, autoFocus]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setCurrentFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error for this field when user starts typing
    if (currentErrors[name]) {
      setCurrentErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectChange = (name) => (value) => {
    setCurrentFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (currentErrors[name]) {
      setCurrentErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    fields.forEach(field => {
      const value = currentFormData[field.name];
      
      // Skip validation for fields that are not visible due to dependencies
      if (field.dependencies && field.dependencies.length > 0) {
        const isVisible = field.dependencies.every(dep => {
          const expectedValue = field.dependsOn?.[dep];
          const actualValue = currentFormData[dep];
          
          if (Array.isArray(expectedValue)) {
            return expectedValue.includes(actualValue);
          }
          
          return actualValue === expectedValue;
        });
        
        if (!isVisible) {
          return; // Skip validation for hidden fields
        }
      }
      
      // Required field validation
      if (field.required) {
        if (field.type === 'multiselect') {
          if (!Array.isArray(value) || value.length === 0) {
            errors[field.name] = field.errorMessages?.required || `${field.label} is required`;
          }
        } else if (field.type === 'checkbox') {
          if (!value) {
            errors[field.name] = field.errorMessages?.required || `${field.label} must be checked`;
          }
        } else if (!value || (typeof value === 'string' && !value.trim())) {
          errors[field.name] = field.errorMessages?.required || `${field.label} is required`;
        }
      }
      
      // Type-specific validation
      if (value && typeof value === 'string' && value.trim()) {
        switch (field.type) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors[field.name] = field.errorMessages?.invalid || 'Please enter a valid email address';
            }
            break;
            
          case 'tel':
            // Enhanced phone number validation supporting international formats
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[\d\s\-\(\)]{8,20}$/;
            const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
            if (!phoneRegex.test(cleanPhone) || cleanPhone.length < 8) {
              errors[field.name] = field.errorMessages?.invalid || 'Please enter a valid phone number';
            }
            break;
            
          case 'url':
            try {
              new URL(value);
            } catch {
              errors[field.name] = field.errorMessages?.invalid || 'Please enter a valid URL';
            }
            break;
            
          case 'number':
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              errors[field.name] = field.errorMessages?.invalid || 'Please enter a valid number';
            } else {
              if (field.min !== undefined && numValue < field.min) {
                errors[field.name] = field.errorMessages?.min || `Value must be at least ${field.min}`;
              }
              if (field.max !== undefined && numValue > field.max) {
                errors[field.name] = field.errorMessages?.max || `Value must be at most ${field.max}`;
              }
            }
            break;

          case 'date':
          case 'datetime-local':
            const dateValue = new Date(value);
            if (isNaN(dateValue.getTime())) {
              errors[field.name] = field.errorMessages?.invalid || 'Please enter a valid date';
            } else {
              if (field.min && new Date(field.min) > dateValue) {
                errors[field.name] = field.errorMessages?.min || `Date must be after ${field.min}`;
              }
              if (field.max && new Date(field.max) < dateValue) {
                errors[field.name] = field.errorMessages?.max || `Date must be before ${field.max}`;
              }
            }
            break;

          case 'time':
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(value)) {
              errors[field.name] = field.errorMessages?.invalid || 'Please enter a valid time (HH:MM)';
            }
            break;
        }
      }

      // Length validation
      if (value && typeof value === 'string') {
        if (field.minLength && value.length < field.minLength) {
          errors[field.name] = field.errorMessages?.minLength || `Must be at least ${field.minLength} characters`;
        }
        if (field.maxLength && value.length > field.maxLength) {
          errors[field.name] = field.errorMessages?.maxLength || `Must be no more than ${field.maxLength} characters`;
        }
      }

      // Pattern validation
      if (field.pattern && value && typeof value === 'string') {
        const regex = new RegExp(field.pattern);
        if (!regex.test(value)) {
          errors[field.name] = field.errorMessages?.pattern || 'Please enter a valid format';
        }
      }
      
      // Custom validation
      if (field.validate && typeof field.validate === 'function') {
        const customError = field.validate(value, currentFormData);
        if (customError) {
          errors[field.name] = customError;
        }
      }
    });
    
    setCurrentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit(currentFormData);
    } catch (error) {
      // Handle submission errors
      console.error('Form submission error:', error);
    }
  };

  const renderField = (field, index) => {
    const isFirstInput = index === 0;
    
    // Get the appropriate value based on field type
    const getFieldValue = () => {
      const value = currentFormData[field.name];
      
      if (field.type === 'multiselect') {
        return Array.isArray(value) ? value : [];
      } else if (field.type === 'checkbox') {
        return Boolean(value);
      } else {
        return value !== undefined ? value : (field.defaultValue || '');
      }
    };
    
    return (
      <FormField
        key={field.name}
        ref={isFirstInput ? firstInputRef : undefined}
        type={field.type}
        label={field.label}
        name={field.name}
        value={getFieldValue()}
        onChange={field.type === 'select' || field.type === 'multiselect' ? handleSelectChange(field.name) : handleChange}
        required={field.required}
        placeholder={field.placeholder}
        options={field.options}
        min={field.min}
        max={field.max}
        step={field.step}
        rows={field.rows}
        error={currentErrors[field.name]}
        help={field.help}
        disabled={field.disabled || isSubmitting}
        multiple={field.type === 'multiselect'}
        onAdd={field.onAdd}
        autoFocus={isFirstInput && autoFocus}
        dependencies={field.dependencies}
        dependsOn={field.dependsOn}
        formData={currentFormData}
        validate={field.validate}
        minLength={field.minLength}
        maxLength={field.maxLength}
        pattern={field.pattern}
        errorMessages={field.errorMessages}
        {...field.props}
      />
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${overlayClassName}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      {...props}
    >
      <div 
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl w-full ${currentSizeConfig.maxWidth} max-h-[90vh] overflow-hidden flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between ${currentSizeConfig.padding} border-b border-gray-200 ${headerClassName}`}>
          <h3 
            id="modal-title"
            className={`${currentSizeConfig.titleSize} font-semibold text-gray-900 flex items-center gap-3`}
          >
            {icon && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentIconColor}`}>
                {icon}
              </div>
            )}
            {title}
          </h3>
          
          {showCloseButton && (
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-y-auto ${currentSizeConfig.padding} ${bodyClassName}`}>
          <form onSubmit={handleSubmit} className={currentSizeConfig.spacing}>
            {fields.map((field, index) => renderField(field, index))}
          </form>
        </div>

        {/* Footer */}
        <div className={`flex justify-end space-x-3 ${currentSizeConfig.padding} border-t border-gray-200 bg-gray-50 ${footerClassName}`}>
          <TouchButton
            type="button"
            variant="secondary"
            size="md"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {cancelButtonText}
          </TouchButton>
          
          <TouchButton
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : submitButtonText}
          </TouchButton>
        </div>
      </div>
    </div>
  );
};

export default InlineAddModal;