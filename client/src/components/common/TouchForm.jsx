import React from 'react'
import clsx from 'clsx'

const TouchInput = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={clsx('mb-4', className)}>
      {label && (
        <label 
          htmlFor={name} 
          className="block mb-2 font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={clsx(
          'w-full min-h-[48px] px-4 py-3 text-base rounded-lg border-2 transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'touch-manipulation',
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900',
          error ? 'border-red-500' : 'border-gray-300',
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

const TouchSelect = ({
  label,
  name,
  options = [],
  value,
  onChange,
  error,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={clsx('mb-4', className)}>
      {label && (
        <label 
          htmlFor={name} 
          className="block mb-2 font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={clsx(
            'w-full min-h-[48px] px-4 py-3 text-base rounded-lg border-2 transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'touch-manipulation appearance-none',
            disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900',
            error ? 'border-red-500' : 'border-gray-300',
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

const TouchTextarea = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className={clsx('mb-4', className)}>
      {label && (
        <label 
          htmlFor={name} 
          className="block mb-2 font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        rows={rows}
        className={clsx(
          'w-full min-h-[48px] px-4 py-3 text-base rounded-lg border-2 transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'touch-manipulation',
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900',
          error ? 'border-red-500' : 'border-gray-300',
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

const TouchCheckbox = ({
  label,
  name,
  checked,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={clsx('mb-4', className)}>
      <div className="flex items-center">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={clsx(
            'w-5 h-5 rounded border-2 transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'touch-manipulation',
            disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900',
            error ? 'border-red-500' : 'border-gray-300',
          )}
          {...props}
        />
        {label && (
          <label 
            htmlFor={name} 
            className="ml-3 font-medium text-gray-700 min-h-[44px] flex items-center"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

const TouchRadio = ({
  label,
  name,
  value,
  checked,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={clsx('mb-2', className)}>
      <div className="flex items-center">
        <input
          id={`${name}-${value}`}
          name={name}
          type="radio"
          value={value}
          checked={checked}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={clsx(
            'w-5 h-5 rounded-full border-2 transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'touch-manipulation',
            disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900',
            error ? 'border-red-500' : 'border-gray-300',
          )}
          {...props}
        />
        {label && (
          <label 
            htmlFor={`${name}-${value}`} 
            className="ml-3 font-medium text-gray-700 min-h-[44px] flex items-center"
          >
            {label}
          </label>
        )}
      </div>
    </div>
  )
}

const TouchRadioGroup = ({
  label,
  name,
  options = [],
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={clsx('mb-4', className)}>
      {label && (
        <label className="block mb-2 font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <TouchRadio
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            checked={value === option.value}
            onChange={onChange}
            disabled={disabled || option.disabled}
            {...props}
          />
        ))}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

const TouchForm = {
  Input: TouchInput,
  Select: TouchSelect,
  Textarea: TouchTextarea,
  Checkbox: TouchCheckbox,
  Radio: TouchRadio,
  RadioGroup: TouchRadioGroup
}

export default TouchForm