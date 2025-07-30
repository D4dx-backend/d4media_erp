import {
  isMobile,
  isTablet,
  isIOS,
  isAndroid,
  getBreakpoint,
  throttle,
  debounce,
  addTouchSupport
} from '../mobileUtils'

// Mock navigator and window objects
const mockNavigator = (userAgent) => {
  Object.defineProperty(global.navigator, 'userAgent', {
    value: userAgent,
    writable: true
  })
}

const mockWindow = (width, height) => {
  Object.defineProperty(global, 'window', {
    value: {
      ...global.window,
      innerWidth: width,
      innerHeight: height,
      screen: {
        availWidth: width,
        availHeight: height
      }
    },
    writable: true
  })
}

describe('Mobile Utilities', () => {
  const originalNavigator = global.navigator
  const originalWindow = global.window
  
  afterEach(() => {
    // Restore original objects
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true
    })
    
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true
    })
  })
  
  describe('Device Detection', () => {
    test('isMobile detects mobile devices', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
      expect(isMobile()).toBe(true)
      
      mockNavigator('Mozilla/5.0 (Android 10; Mobile)')
      expect(isMobile()).toBe(true)
      
      mockNavigator('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
      expect(isMobile()).toBe(false)
    })
    
    test('isTablet detects tablet devices', () => {
      mockNavigator('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)')
      expect(isTablet()).toBe(true)
      
      mockNavigator('Mozilla/5.0 (Android 10; Tablet)')
      expect(isTablet()).toBe(true)
      
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
      expect(isTablet()).toBe(false)
    })
    
    test('isIOS detects iOS devices', () => {
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
      expect(isIOS()).toBe(true)
      
      mockNavigator('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)')
      expect(isIOS()).toBe(true)
      
      mockNavigator('Mozilla/5.0 (Android 10; Mobile)')
      expect(isIOS()).toBe(false)
    })
    
    test('isAndroid detects Android devices', () => {
      mockNavigator('Mozilla/5.0 (Android 10; Mobile)')
      expect(isAndroid()).toBe(true)
      
      mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
      expect(isAndroid()).toBe(false)
    })
  })
  
  describe('Screen Size Utilities', () => {
    test('getBreakpoint returns correct breakpoint', () => {
      mockWindow(320, 568)
      expect(getBreakpoint()).toBe('sm')
      
      mockWindow(700, 800)
      expect(getBreakpoint()).toBe('md')
      
      mockWindow(900, 800)
      expect(getBreakpoint()).toBe('lg')
      
      mockWindow(1100, 800)
      expect(getBreakpoint()).toBe('xl')
      
      mockWindow(1300, 800)
      expect(getBreakpoint()).toBe('2xl')
    })
  })
  
  describe('Performance Utilities', () => {
    test('throttle limits function calls', () => {
      jest.useFakeTimers()
      
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)
      
      // Call multiple times in quick succession
      throttledFn()
      throttledFn()
      throttledFn()
      
      // Should only be called once
      expect(mockFn).toHaveBeenCalledTimes(1)
      
      // Advance time
      jest.advanceTimersByTime(101)
      
      // Call again
      throttledFn()
      
      // Should be called again
      expect(mockFn).toHaveBeenCalledTimes(2)
      
      jest.useRealTimers()
    })
    
    test('debounce delays function calls', () => {
      jest.useFakeTimers()
      
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)
      
      // Call multiple times in quick succession
      debouncedFn()
      debouncedFn()
      debouncedFn()
      
      // Should not be called yet
      expect(mockFn).not.toHaveBeenCalled()
      
      // Advance time
      jest.advanceTimersByTime(101)
      
      // Should be called once
      expect(mockFn).toHaveBeenCalledTimes(1)
      
      jest.useRealTimers()
    })
  })
  
  describe('Touch Support', () => {
    test('addTouchSupport adds event listeners', () => {
      // Create a mock element
      const element = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }
      
      const options = {
        onTap: jest.fn(),
        onSwipeLeft: jest.fn()
      }
      
      // Add touch support
      const cleanup = addTouchSupport(element, options)
      
      // Check if event listeners were added
      expect(element.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object))
      expect(element.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), expect.any(Object))
      expect(element.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), expect.any(Object))
      
      // Call cleanup function
      cleanup()
      
      // Check if event listeners were removed
      expect(element.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function))
      expect(element.removeEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function))
      expect(element.removeEventListener).toHaveBeenCalledWith('touchend', expect.any(Function))
    })
  })
})