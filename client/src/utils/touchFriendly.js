/**
 * Touch-friendly UI utilities and helpers
 */

// Touch target size constants (following WCAG guidelines)
export const TOUCH_TARGET_SIZE = {
  MINIMUM: 44, // 44px minimum for accessibility
  COMFORTABLE: 48, // 48px for comfortable touch
  LARGE: 56 // 56px for primary actions
}

// Touch-friendly spacing
export const TOUCH_SPACING = {
  TIGHT: 8,
  NORMAL: 16,
  COMFORTABLE: 24,
  LOOSE: 32
}

// Validate touch target size
export const validateTouchTarget = (element) => {
  const rect = element.getBoundingClientRect()
  const minSize = TOUCH_TARGET_SIZE.MINIMUM
  
  return {
    isValid: rect.width >= minSize && rect.height >= minSize,
    width: rect.width,
    height: rect.height,
    recommendations: {
      width: Math.max(minSize, rect.width),
      height: Math.max(minSize, rect.height)
    }
  }
}

// Add touch-friendly styles to elements
export const makeTouchFriendly = (element, options = {}) => {
  const {
    minSize = TOUCH_TARGET_SIZE.MINIMUM,
    padding = TOUCH_SPACING.NORMAL,
    margin = TOUCH_SPACING.NORMAL
  } = options
  
  const styles = {
    minWidth: `${minSize}px`,
    minHeight: `${minSize}px`,
    padding: `${padding}px`,
    margin: `${margin}px`,
    cursor: 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation'
  }
  
  Object.assign(element.style, styles)
  
  // Add touch feedback
  addTouchFeedback(element)
  
  return element
}

// Add visual feedback for touch interactions
export const addTouchFeedback = (element, options = {}) => {
  const {
    activeClass = 'touch-active',
    duration = 150,
    scale = 0.95,
    opacity = 0.7
  } = options
  
  let touchActive = false
  
  const addActiveState = () => {
    if (touchActive) return
    touchActive = true
    
    element.classList.add(activeClass)
    element.style.transform = `scale(${scale})`
    element.style.opacity = opacity
    element.style.transition = `all ${duration}ms ease-out`
  }
  
  const removeActiveState = () => {
    if (!touchActive) return
    touchActive = false
    
    element.classList.remove(activeClass)
    element.style.transform = ''
    element.style.opacity = ''
    
    setTimeout(() => {
      element.style.transition = ''
    }, duration)
  }
  
  // Touch events
  element.addEventListener('touchstart', addActiveState, { passive: true })
  element.addEventListener('touchend', removeActiveState, { passive: true })
  element.addEventListener('touchcancel', removeActiveState, { passive: true })
  
  // Mouse events for desktop
  element.addEventListener('mousedown', addActiveState)
  element.addEventListener('mouseup', removeActiveState)
  element.addEventListener('mouseleave', removeActiveState)
  
  return () => {
    element.removeEventListener('touchstart', addActiveState)
    element.removeEventListener('touchend', removeActiveState)
    element.removeEventListener('touchcancel', removeActiveState)
    element.removeEventListener('mousedown', addActiveState)
    element.removeEventListener('mouseup', removeActiveState)
    element.removeEventListener('mouseleave', removeActiveState)
  }
}

// Create touch-friendly button component
export const createTouchButton = (text, onClick, options = {}) => {
  const {
    variant = 'primary',
    size = 'medium',
    disabled = false,
    icon = null
  } = options
  
  const button = document.createElement('button')
  button.textContent = text
  button.disabled = disabled
  
  // Base styles
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    textAlign: 'center',
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation'
  }
  
  // Size variants
  const sizeStyles = {
    small: {
      minHeight: `${TOUCH_TARGET_SIZE.MINIMUM}px`,
      padding: '8px 16px',
      fontSize: '14px'
    },
    medium: {
      minHeight: `${TOUCH_TARGET_SIZE.COMFORTABLE}px`,
      padding: '12px 24px',
      fontSize: '16px'
    },
    large: {
      minHeight: `${TOUCH_TARGET_SIZE.LARGE}px`,
      padding: '16px 32px',
      fontSize: '18px'
    }
  }
  
  // Color variants
  const colorStyles = {
    primary: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    secondary: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    success: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    danger: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#3b82f6',
      border: '2px solid #3b82f6'
    }
  }
  
  // Apply styles
  Object.assign(button.style, baseStyles, sizeStyles[size], colorStyles[variant])
  
  // Add icon if provided
  if (icon) {
    const iconElement = document.createElement('span')
    iconElement.innerHTML = icon
    iconElement.style.marginRight = '8px'
    button.insertBefore(iconElement, button.firstChild)
  }
  
  // Add touch feedback
  if (!disabled) {
    addTouchFeedback(button)
    button.addEventListener('click', onClick)
  }
  
  return button
}

// Create touch-friendly input field
export const createTouchInput = (options = {}) => {
  const {
    type = 'text',
    placeholder = '',
    label = '',
    required = false,
    disabled = false
  } = options
  
  const container = document.createElement('div')
  container.style.marginBottom = `${TOUCH_SPACING.NORMAL}px`
  
  // Label
  if (label) {
    const labelElement = document.createElement('label')
    labelElement.textContent = label
    labelElement.style.display = 'block'
    labelElement.style.marginBottom = '8px'
    labelElement.style.fontWeight = '500'
    labelElement.style.color = '#374151'
    container.appendChild(labelElement)
  }
  
  // Input
  const input = document.createElement('input')
  input.type = type
  input.placeholder = placeholder
  input.required = required
  input.disabled = disabled
  
  const inputStyles = {
    width: '100%',
    minHeight: `${TOUCH_TARGET_SIZE.COMFORTABLE}px`,
    padding: '12px 16px',
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px', // Prevents zoom on iOS
    backgroundColor: disabled ? '#f9fafb' : 'white',
    color: disabled ? '#6b7280' : '#111827',
    outline: 'none',
    transition: 'border-color 0.2s ease-in-out'
  }
  
  Object.assign(input.style, inputStyles)
  
  // Focus styles
  input.addEventListener('focus', () => {
    input.style.borderColor = '#3b82f6'
    input.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
  })
  
  input.addEventListener('blur', () => {
    input.style.borderColor = '#d1d5db'
    input.style.boxShadow = 'none'
  })
  
  container.appendChild(input)
  
  return { container, input }
}

// Create touch-friendly select dropdown
export const createTouchSelect = (options = [], selectOptions = {}) => {
  const {
    label = '',
    placeholder = 'Select an option',
    required = false,
    disabled = false
  } = selectOptions
  
  const container = document.createElement('div')
  container.style.marginBottom = `${TOUCH_SPACING.NORMAL}px`
  
  // Label
  if (label) {
    const labelElement = document.createElement('label')
    labelElement.textContent = label
    labelElement.style.display = 'block'
    labelElement.style.marginBottom = '8px'
    labelElement.style.fontWeight = '500'
    labelElement.style.color = '#374151'
    container.appendChild(labelElement)
  }
  
  // Select
  const select = document.createElement('select')
  select.required = required
  select.disabled = disabled
  
  const selectStyles = {
    width: '100%',
    minHeight: `${TOUCH_TARGET_SIZE.COMFORTABLE}px`,
    padding: '12px 16px',
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    backgroundColor: disabled ? '#f9fafb' : 'white',
    color: disabled ? '#6b7280' : '#111827',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 12px center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '16px',
    paddingRight: '40px'
  }
  
  Object.assign(select.style, selectStyles)
  
  // Add placeholder option
  if (placeholder) {
    const placeholderOption = document.createElement('option')
    placeholderOption.value = ''
    placeholderOption.textContent = placeholder
    placeholderOption.disabled = true
    placeholderOption.selected = true
    select.appendChild(placeholderOption)
  }
  
  // Add options
  options.forEach(option => {
    const optionElement = document.createElement('option')
    optionElement.value = option.value
    optionElement.textContent = option.label
    select.appendChild(optionElement)
  })
  
  // Focus styles
  select.addEventListener('focus', () => {
    select.style.borderColor = '#3b82f6'
    select.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
  })
  
  select.addEventListener('blur', () => {
    select.style.borderColor = '#d1d5db'
    select.style.boxShadow = 'none'
  })
  
  container.appendChild(select)
  
  return { container, select }
}

// Audit page for touch-friendliness
export const auditTouchFriendliness = () => {
  const issues = []
  const interactiveElements = document.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [tabindex]'
  )
  
  interactiveElements.forEach((element, index) => {
    const validation = validateTouchTarget(element)
    
    if (!validation.isValid) {
      issues.push({
        element,
        index,
        current: {
          width: validation.width,
          height: validation.height
        },
        recommended: validation.recommendations,
        selector: element.tagName.toLowerCase() + 
                 (element.id ? `#${element.id}` : '') +
                 (element.className ? `.${element.className.split(' ').join('.')}` : '')
      })
    }
  })
  
  return {
    totalElements: interactiveElements.length,
    issues: issues.length,
    details: issues,
    score: Math.round(((interactiveElements.length - issues.length) / interactiveElements.length) * 100)
  }
}

// Initialize touch-friendly defaults
export const initTouchFriendlyDefaults = () => {
  // Add global touch-friendly CSS
  const style = document.createElement('style')
  style.textContent = `
    /* Touch-friendly global styles */
    * {
      -webkit-tap-highlight-color: transparent;
    }
    
    button, input, select, textarea {
      touch-action: manipulation;
    }
    
    .touch-active {
      transform: scale(0.95);
      opacity: 0.7;
    }
    
    /* Ensure minimum touch target sizes */
    button:not(.btn-sm), 
    input:not([type="hidden"]), 
    select, 
    textarea,
    a[role="button"],
    [role="button"] {
      min-height: ${TOUCH_TARGET_SIZE.MINIMUM}px;
      min-width: ${TOUCH_TARGET_SIZE.MINIMUM}px;
    }
    
    /* Improve form controls on mobile */
    @media (max-width: 768px) {
      input, select, textarea {
        font-size: 16px; /* Prevents zoom on iOS */
      }
    }
  `
  
  document.head.appendChild(style)
  
  console.log('Touch-friendly defaults initialized')
}

// Additional exports needed by components

// Touch checkbox classes
export const TOUCH_CHECKBOX_CLASSES = {
  container: 'touch-checkbox-container',
  input: 'touch-checkbox-input',
  label: 'touch-checkbox-label',
  checked: 'touch-checkbox-checked',
  disabled: 'touch-checkbox-disabled'
}

// Touch list item classes
export const TOUCH_LIST_ITEM_CLASSES = {
  container: 'touch-list-item',
  active: 'touch-list-item-active',
  selected: 'touch-list-item-selected',
  disabled: 'touch-list-item-disabled',
  draggable: 'touch-list-item-draggable',
  dragging: 'touch-list-item-dragging'
}

// Get input classes based on state
export const getInputClasses = (isValid = true, isTouched = false, isFocused = false) => {
  const baseClasses = 'touch-input w-full px-4 py-3 rounded-lg border text-base transition-colors duration-200'
  
  if (!isTouched) {
    return `${baseClasses} border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200`
  }
  
  if (isValid) {
    return `${baseClasses} border-green-500 ${isFocused ? 'ring-2 ring-green-200' : ''}`
  } else {
    return `${baseClasses} border-red-500 ${isFocused ? 'ring-2 ring-red-200' : ''}`
  }
}

// Get pagination classes for touch-friendly pagination
export const getPaginationClasses = (isActive = false, isDisabled = false) => {
  const baseClasses = 'touch-pagination-item inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 py-2 mx-1 rounded-md transition-colors duration-200'
  
  if (isDisabled) {
    return `${baseClasses} text-gray-400 bg-gray-100 cursor-not-allowed`
  }
  
  if (isActive) {
    return `${baseClasses} text-white bg-blue-600 font-medium`
  }
  
  return `${baseClasses} text-gray-700 bg-white hover:bg-gray-100 active:bg-gray-200`
}