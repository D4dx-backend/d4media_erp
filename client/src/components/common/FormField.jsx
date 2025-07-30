import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TouchInput from './TouchInput';
import TouchSelect from './TouchSelect';
import SearchableSelect from './SearchableSelect';

const FormField = React.forwardRef(({
  type = 'text',
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder,
  options = [],
  rows = 3,
  min,
  max,
  step,
  disabled = false,
  error,
  help,
  className = '',
  size = 'md',
  multiple = false,
  onAdd,
  autoFocus = false,
  dependencies = [],
  dependsOn = {},
  validate,
  validationRules = {},
  showValidationIcon = true,
  validateOnChange = true,
  validateOnBlur = true,
  tooltip,
  ...props
}, ref) => {
  const fieldId = `field-${name}`;

  // Field state management
  const [fieldState, setFieldState] = useState({
    isDirty: false,
    isTouched: false,
    isValid: true,
    validationError: null,
    isValidating: false
  });

  // Check if field should be visible based on dependencies
  const isVisible = React.useMemo(() => {
    if (!dependencies.length) return true;
    
    return dependencies.every(dep => {
      const expectedValue = dependsOn[dep];
      const actualValue = props.formData?.[dep];
      
      if (Array.isArray(expectedValue)) {
        return expectedValue.includes(actualValue);
      }
      
      return actualValue === expectedValue;
    });
  }, [dependencies, dependsOn, props.formData]);

  // Validation function
  const validateField = useCallback(async (fieldValue) => {
    if (!validate && !validationRules && !required) {
      return { isValid: true, error: null };
    }

    setFieldState(prev => ({ ...prev, isValidating: true }));

    try {
      // Required field validation
      if (required && (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === ''))) {
        return { isValid: false, error: `${label || name} is required` };
      }

      // Custom validation function
      if (validate && typeof validate === 'function') {
        const result = await validate(fieldValue, props.formData);
        if (result !== true) {
          return { isValid: false, error: result || 'Invalid value' };
        }
      }

      // Built-in validation rules
      if (validationRules && fieldValue) {
        const { minLength, maxLength, pattern, min: minVal, max: maxVal } = validationRules;
        
        if (minLength && fieldValue.length < minLength) {
          return { isValid: false, error: `Minimum ${minLength} characters required` };
        }
        
        if (maxLength && fieldValue.length > maxLength) {
          return { isValid: false, error: `Maximum ${maxLength} characters allowed` };
        }
        
        if (pattern && !new RegExp(pattern).test(fieldValue)) {
          return { isValid: false, error: validationRules.patternMessage || 'Invalid format' };
        }
        
        if (type === 'number' && fieldValue !== '') {
          const numValue = parseFloat(fieldValue);
          if (minVal !== undefined && numValue < minVal) {
            return { isValid: false, error: `Value must be at least ${minVal}` };
          }
          if (maxVal !== undefined && numValue > maxVal) {
            return { isValid: false, error: `Value must be at most ${maxVal}` };
          }
        }

        // Email validation
        if (type === 'email' && fieldValue) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(fieldValue)) {
            return { isValid: false, error: 'Please enter a valid email address' };
          }
        }

        // Phone validation
        if (type === 'tel' && fieldValue) {
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(fieldValue.replace(/[\s\-\(\)]/g, ''))) {
            return { isValid: false, error: 'Please enter a valid phone number' };
          }
        }

        // URL validation
        if (type === 'url' && fieldValue) {
          try {
            new URL(fieldValue);
          } catch {
            return { isValid: false, error: 'Please enter a valid URL' };
          }
        }
      }

      return { isValid: true, error: null };
    } catch (err) {
      return { isValid: false, error: 'Validation error occurred' };
    } finally {
      setFieldState(prev => ({ ...prev, isValidating: false }));
    }
  }, [validate, validationRules, required, label, name, type, props.formData]);

  // Handle field change with validation
  const handleChange = useCallback(async (event) => {
    const newValue = event.target ? event.target.value : event;
    
    // Update field state
    setFieldState(prev => ({
      ...prev,
      isDirty: true,
      isTouched: true
    }));

    // Call original onChange
    if (onChange) {
      onChange(event);
    }

    // Validate on change if enabled
    if (validateOnChange) {
      const validation = await validateField(newValue);
      setFieldState(prev => ({
        ...prev,
        isValid: validation.isValid,
        validationError: validation.error
      }));
    }
  }, [onChange, validateOnChange, validateField]);

  // Handle field blur with validation
  const handleBlur = useCallback(async (event) => {
    const fieldValue = event.target ? event.target.value : value;
    
    setFieldState(prev => ({
      ...prev,
      isTouched: true
    }));

    // Validate on blur if enabled
    if (validateOnBlur) {
      const validation = await validateField(fieldValue);
      setFieldState(prev => ({
        ...prev,
        isValid: validation.isValid,
        validationError: validation.error
      }));
    }

    // Call original onBlur if provided
    if (props.onBlur) {
      props.onBlur(event);
    }
  }, [validateOnBlur, validateField, value, props.onBlur]);

  // Effect to validate when value changes externally
  useEffect(() => {
    if (fieldState.isTouched && validateOnChange) {
      validateField(value).then(validation => {
        setFieldState(prev => ({
          ...prev,
          isValid: validation.isValid,
          validationError: validation.error
        }));
      });
    }
  }, [value, fieldState.isTouched, validateOnChange, validateField]);

  // Determine current error to display
  const currentError = error || fieldState.validationError;
  const hasError = Boolean(currentError);
  const showSuccess = fieldState.isTouched && fieldState.isValid && !hasError && showValidationIcon;

  const renderField = () => {
    // Filter out props that shouldn't be passed to DOM elements
    const {
      dependencies: _deps,
      dependsOn: _dependsOn,
      formData: _formData,
      validate: _validate,
      validationRules: _validationRules,
      showValidationIcon: _showValidationIcon,
      validateOnChange: _validateOnChange,
      validateOnBlur: _validateOnBlur,
      tooltip: _tooltip,
      onAdd: _onAdd,
      ...domProps
    } = props;

    switch (type) {
      case 'select':
        // Use SearchableSelect if searchable prop is true or if there are many options
        if (props.searchable || options.length > 10) {
          return (
            <SearchableSelect
              ref={ref}
              id={fieldId}
              name={name}
              value={value}
              onChange={handleChange}
              options={options}
              placeholder={placeholder}
              disabled={disabled}
              size={size}
              autoFocus={autoFocus}
              error={hasError}
              onAdd={onAdd}
              {...domProps}
            />
          );
        }
        return (
          <TouchSelect
            ref={ref}
            id={fieldId}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            options={options}
            placeholder={placeholder}
            disabled={disabled}
            size={size}
            autoFocus={autoFocus}
            error={hasError}
            {...domProps}
          />
        );

      case 'multiselect':
        return (
          <SearchableSelect
            ref={ref}
            id={fieldId}
            name={name}
            value={value || []}
            onChange={handleChange}
            options={options}
            placeholder={placeholder}
            disabled={disabled}
            multiple={true}
            onAdd={onAdd}
            autoFocus={autoFocus}
            error={hasError}
            {...domProps}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            ref={ref}
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoFocus={autoFocus}
            className={`w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 py-2 px-3 transition-colors ${
              hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            {...domProps}
          />
        );

      case 'email':
        return (
          <TouchInput
            ref={ref}
            type="email"
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder || 'Enter email address'}
            required={required}
            disabled={disabled}
            size={size}
            error={hasError}
            autoFocus={autoFocus}
            {...domProps}
          />
        );

      case 'tel':
        return (
          <TouchInput
            ref={ref}
            type="tel"
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder || 'Enter phone number'}
            required={required}
            disabled={disabled}
            size={size}
            error={hasError}
            autoFocus={autoFocus}
            {...domProps}
          />
        );

      case 'number':
        return (
          <TouchInput
            ref={ref}
            type="number"
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            size={size}
            error={hasError}
            autoFocus={autoFocus}
            {...domProps}
          />
        );

      case 'url':
        return (
          <TouchInput
            ref={ref}
            type="url"
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder || 'Enter URL'}
            required={required}
            disabled={disabled}
            size={size}
            error={hasError}
            autoFocus={autoFocus}
            {...domProps}
          />
        );

      case 'password':
        return (
          <TouchInput
            ref={ref}
            type="password"
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            size={size}
            error={hasError}
            autoFocus={autoFocus}
            {...domProps}
          />
        );

      case 'date':
        return (
          <TouchInput
            ref={ref}
            type="date"
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            size={size}
            error={hasError}
            autoFocus={autoFocus}
            {...domProps}
          />
        );

      case 'datetime-local':
        return (
          <TouchInput
            ref={ref}
            type="datetime-local"
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            size={size}
            error={hasError}
            autoFocus={autoFocus}
            {...domProps}
          />
        );

      case 'time':
        return (
          <TouchInput
            ref={ref}
            type="time"
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            size={size}
            error={hasError}
            autoFocus={autoFocus}
            {...domProps}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              ref={ref}
              type="checkbox"
              id={fieldId}
              name={name}
              checked={value || false}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={disabled}
              required={required}
              autoFocus={autoFocus}
              className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                hasError ? 'border-red-500' : ''
              } ${disabled ? 'cursor-not-allowed' : ''}`}
              {...domProps}
            />
            {label && (
              <label htmlFor={fieldId} className="ml-2 block text-sm text-gray-900">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
          </div>
        );
      
      default:
        return (
          <TouchInput
            ref={ref}
            type={type}
            id={fieldId}
            name={name}
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            size={size}
            error={hasError}
            autoFocus={autoFocus}
            {...domProps}
          />
        );
    }
  };

  // Don't render field if dependencies are not met
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {label && type !== 'checkbox' && (
        <div className="flex items-center justify-between">
          <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {tooltip && (
            <div className="relative group">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Field help"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {tooltip}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="relative">
        {renderField()}
        
        {/* Validation Icons */}
        {showValidationIcon && fieldState.isTouched && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {fieldState.isValidating ? (
              <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : hasError ? (
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : showSuccess ? (
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : null}
          </div>
        )}
      </div>
      
      {currentError && (
        <p className="text-sm text-red-600 flex items-center" role="alert" aria-live="polite">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {currentError}
        </p>
      )}
      
      {help && !currentError && (
        <p className="text-sm text-gray-500 flex items-center">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {help}
        </p>
      )}
      
      {/* Field State Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && fieldState.isDirty && (
        <div className="text-xs text-gray-400 mt-1">
          State: {fieldState.isDirty ? 'dirty' : 'clean'} | {fieldState.isTouched ? 'touched' : 'untouched'} | {fieldState.isValid ? 'valid' : 'invalid'}
        </div>
      )}
    </div>
  );
});

export default FormField;