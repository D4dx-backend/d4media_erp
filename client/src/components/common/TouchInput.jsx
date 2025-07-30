import React from 'react';
import { getInputClasses } from '../../utils/touchFriendly';

/**
 * TouchInput - A touch-friendly input component that meets accessibility standards
 * 
 * @param {string} id - Input ID for label association
 * @param {string} name - Input name for form submission
 * @param {string} type - Input type (text, email, password, etc.)
 * @param {string} value - Input value
 * @param {function} onChange - Change handler function
 * @param {string} placeholder - Input placeholder text
 * @param {string} size - Input size (sm, md, lg)
 * @param {boolean} required - Whether the input is required
 * @param {boolean} disabled - Whether the input is disabled
 * @param {boolean} readOnly - Whether the input is read-only
 * @param {boolean} hasError - Whether the input has an error
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} leftIcon - Icon to display on the left side of the input
 * @param {React.ReactNode} rightIcon - Icon to display on the right side of the input
 * @param {object} props - Additional props to pass to the input element
 */
const TouchInput = React.forwardRef(({
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  size = 'md',
  required = false,
  disabled = false,
  readOnly = false,
  hasError = false,
  error,
  className = '',
  leftIcon,
  rightIcon,
  autoFocus = false,
  min,
  max,
  step,
  ...props
}, ref) => {
  const inputClasses = getInputClasses(size, { hasError: hasError || !!error, disabled });
  
  // Filter out non-DOM props that might be passed from FormField
  const {
    dependencies: _deps,
    dependsOn: _dependsOn,
    formData: _formData,
    validate: _validate,
    minLength: _minLength,
    maxLength: _maxLength,
    pattern: _pattern,
    errorMessages: _errorMessages,
    onAdd: _onAdd,
    help: _help,
    label: _label,
    options: _options,
    rows: _rows,
    multiple: _multiple,
    ...domProps
  } = props;
  
  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {leftIcon}
        </div>
      )}
      
      <input
        ref={ref}
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        autoFocus={autoFocus}
        min={min}
        max={max}
        step={step}
        className={`
          ${inputClasses}
          ${leftIcon ? 'pl-10' : ''}
          ${rightIcon ? 'pr-10' : ''}
          ${className}
        `}
        {...domProps}
      />
      
      {rightIcon && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {rightIcon}
        </div>
      )}
    </div>
  );
});

export default TouchInput;