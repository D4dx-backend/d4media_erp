import React, { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { isMobile } from '../../utils/mobileUtils'

const TouchSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  name,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const selectRef = useRef(null)
  const nativeSelectRef = useRef(null)
  
  // Find the selected option label
  const selectedOption = options.find(option => option.value === value)
  const displayValue = selectedOption ? selectedOption.label : placeholder
  
  useEffect(() => {
    // Check if mobile on mount
    setIsMobileDevice(isMobile())
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  // For mobile devices, use the native select for better UX
  if (isMobileDevice) {
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
            ref={nativeSelectRef}
            id={name}
            name={name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
            className={clsx(
              'w-full min-h-[48px] px-4 py-3 text-base rounded-lg border-2 transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'appearance-none',
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
  
  // Custom dropdown for desktop
  return (
    <div className={clsx('mb-4', className)}>
      {label && (
        <label 
          className="block mb-2 font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative" ref={selectRef}>
        {/* Custom select trigger */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label}
          className={clsx(
            'w-full min-h-[48px] px-4 py-3 text-base rounded-lg border-2 transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'flex items-center justify-between',
            disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900',
            error ? 'border-red-500' : 'border-gray-300',
          )}
          disabled={disabled}
        >
          <span className={clsx(
            !selectedOption && 'text-gray-400'
          )}>
            {displayValue}
          </span>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Dropdown options */}
        {isOpen && (
          <div 
            className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
            role="listbox"
          >
            {options.map((option) => (
              <div
                key={option.value}
                className={clsx(
                  'px-4 py-3 cursor-pointer min-h-[48px] flex items-center',
                  'hover:bg-blue-50 focus:bg-blue-50',
                  option.value === value ? 'bg-blue-100 font-medium' : ''
                )}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                role="option"
                aria-selected={option.value === value}
              >
                {option.label}
              </div>
            ))}
            {options.length === 0 && (
              <div className="px-4 py-3 text-gray-500">
                No options available
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {/* Hidden native select for form submission */}
      <input 
        type="hidden" 
        name={name} 
        value={value || ''} 
        required={required}
      />
    </div>
  )
}

export default TouchSelect