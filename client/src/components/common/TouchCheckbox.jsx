import React from 'react';
import { TOUCH_CHECKBOX_CLASSES } from '../../utils/touchFriendly';

/**
 * TouchCheckbox - A touch-friendly checkbox component that meets accessibility standards
 * 
 * @param {string} id - Checkbox ID for label association
 * @param {string} name - Checkbox name for form submission
 * @param {boolean} checked - Whether the checkbox is checked
 * @param {function} onChange - Change handler function
 * @param {string} label - Checkbox label text
 * @param {boolean} disabled - Whether the checkbox is disabled
 * @param {string} className - Additional CSS classes for the container
 * @param {string} inputClassName - Additional CSS classes for the input
 * @param {string} labelClassName - Additional CSS classes for the label
 * @param {object} props - Additional props to pass to the checkbox element
 */
const TouchCheckbox = ({
  id,
  name,
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  inputClassName = '',
  labelClassName = '',
  ...props
}) => {
  const containerClass = `${TOUCH_CHECKBOX_CLASSES.container} ${className}`;
  const inputClass = `${TOUCH_CHECKBOX_CLASSES.input} ${inputClassName}`;
  const labelClass = `${TOUCH_CHECKBOX_CLASSES.label} ${labelClassName}`;
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <div className={`${containerClass} ${disabledClass}`}>
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={inputClass}
        {...props}
      />
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
    </div>
  );
};

export default TouchCheckbox;