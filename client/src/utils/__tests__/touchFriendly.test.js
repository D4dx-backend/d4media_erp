import {
  TOUCH_TARGET_SIZE,
  TOUCH_SPACING,
  validateTouchTarget,
  makeTouchFriendly,
  addTouchFeedback,
  createTouchButton,
  createTouchInput,
  createTouchSelect,
  auditTouchFriendliness,
  initTouchFriendlyDefaults
} from '../touchFriendly'

describe('Touch-Friendly Utilities', () => {
  beforeEach(() => {
    // Create a clean DOM environment for each test
    document.body.innerHTML = ''
  })
  
  describe('Constants', () => {
    test('TOUCH_TARGET_SIZE defines minimum touch target sizes', () => {
      expect(TOUCH_TARGET_SIZE.MINIMUM).toBe(44)
      expect(TOUCH_TARGET_SIZE.COMFORTABLE).toBe(48)
      expect(TOUCH_TARGET_SIZE.LARGE).toBe(56)
    })
    
    test('TOUCH_SPACING defines spacing values', () => {
      expect(TOUCH_SPACING.TIGHT).toBe(8)
      expect(TOUCH_SPACING.NORMAL).toBe(16)
      expect(TOUCH_SPACING.COMFORTABLE).toBe(24)
      expect(TOUCH_SPACING.LOOSE).toBe(32)
    })
  })
  
  describe('Touch Target Validation', () => {
    test('validateTouchTarget checks element size against minimum', () => {
      // Create test element
      const element = document.createElement('button')
      
      // Mock getBoundingClientRect
      element.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 40,
        height: 30
      })
      
      const result = validateTouchTarget(element)
      
      expect(result.isValid).toBe(false)
      expect(result.recommendations.width).toBe(44)
      expect(result.recommendations.height).toBe(44)
      
      // Test valid size
      element.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 50,
        height: 50
      })
      
      const validResult = validateTouchTarget(element)
      
      expect(validResult.isValid).toBe(true)
    })
  })
  
  describe('Touch-Friendly Elements', () => {
    test('makeTouchFriendly applies touch-friendly styles', () => {
      const element = document.createElement('button')
      document.body.appendChild(element)
      
      makeTouchFriendly(element)
      
      expect(element.style.minWidth).toBe(`${TOUCH_TARGET_SIZE.MINIMUM}px`)
      expect(element.style.minHeight).toBe(`${TOUCH_TARGET_SIZE.MINIMUM}px`)
      expect(element.style.padding).toBe(`${TOUCH_SPACING.NORMAL}px`)
      expect(element.style.touchAction).toBe('manipulation')
    })
    
    test('addTouchFeedback adds visual feedback for touch', () => {
      const element = document.createElement('button')
      document.body.appendChild(element)
      
      const cleanup = addTouchFeedback(element)
      
      // Simulate touch start
      const touchStartEvent = new Event('touchstart')
      element.dispatchEvent(touchStartEvent)
      
      expect(element.classList.contains('touch-active')).toBe(true)
      expect(element.style.transform).toBe('scale(0.95)')
      expect(element.style.opacity).toBe('0.7')
      
      // Simulate touch end
      const touchEndEvent = new Event('touchend')
      element.dispatchEvent(touchEndEvent)
      
      expect(element.classList.contains('touch-active')).toBe(false)
      expect(element.style.transform).toBe('')
      
      // Test cleanup
      cleanup()
    })
  })
  
  describe('Touch UI Components', () => {
    test('createTouchButton creates a button with touch-friendly properties', () => {
      const onClick = jest.fn()
      const button = createTouchButton('Click Me', onClick, {
        variant: 'primary',
        size: 'medium'
      })
      
      document.body.appendChild(button)
      
      expect(button.textContent).toBe('Click Me')
      expect(button.style.minHeight).toBe(`${TOUCH_TARGET_SIZE.COMFORTABLE}px`)
      expect(button.style.touchAction).toBe('manipulation')
      
      // Test click handler
      button.click()
      expect(onClick).toHaveBeenCalled()
    })
    
    test('createTouchInput creates an input with touch-friendly properties', () => {
      const { container, input } = createTouchInput({
        type: 'text',
        placeholder: 'Enter text',
        label: 'Name'
      })
      
      document.body.appendChild(container)
      
      const labelElement = container.querySelector('label')
      
      expect(labelElement.textContent).toBe('Name')
      expect(input.placeholder).toBe('Enter text')
      expect(input.type).toBe('text')
      expect(input.style.minHeight).toBe(`${TOUCH_TARGET_SIZE.COMFORTABLE}px`)
    })
    
    test('createTouchSelect creates a select with touch-friendly properties', () => {
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' }
      ]
      
      const { container, select } = createTouchSelect(options, {
        label: 'Select Option',
        placeholder: 'Choose an option'
      })
      
      document.body.appendChild(container)
      
      const labelElement = container.querySelector('label')
      const optionElements = select.querySelectorAll('option')
      
      expect(labelElement.textContent).toBe('Select Option')
      expect(optionElements.length).toBe(3) // Including placeholder
      expect(optionElements[0].textContent).toBe('Choose an option')
      expect(optionElements[1].textContent).toBe('Option 1')
      expect(optionElements[2].textContent).toBe('Option 2')
      expect(select.style.minHeight).toBe(`${TOUCH_TARGET_SIZE.COMFORTABLE}px`)
    })
  })
  
  describe('Touch Audit', () => {
    test('auditTouchFriendliness checks elements for touch-friendliness', () => {
      // Create test elements
      const button = document.createElement('button')
      button.id = 'test-button'
      button.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 30,
        height: 30
      })
      
      const link = document.createElement('a')
      link.setAttribute('role', 'button')
      link.id = 'test-link'
      link.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 50,
        height: 50
      })
      
      document.body.appendChild(button)
      document.body.appendChild(link)
      
      const audit = auditTouchFriendliness()
      
      expect(audit.totalElements).toBe(2)
      expect(audit.issues).toBe(1)
      expect(audit.details[0].element).toBe(button)
      expect(audit.score).toBe(50) // 1 out of 2 elements pass
    })
  })
  
  describe('Initialization', () => {
    test('initTouchFriendlyDefaults adds global touch-friendly styles', () => {
      initTouchFriendlyDefaults()
      
      const styleElement = document.head.querySelector('style')
      
      expect(styleElement).toBeTruthy()
      expect(styleElement.textContent).toContain('touch-action: manipulation')
      expect(styleElement.textContent).toContain(`min-height: ${TOUCH_TARGET_SIZE.MINIMUM}px`)
    })
  })
})