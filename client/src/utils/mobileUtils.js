/**
 * Mobile-specific utilities for touch interactions and responsive behavior
 */

// Device detection
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export const isTablet = () => {
  return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent)
}

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export const isAndroid = () => {
  return /Android/i.test(navigator.userAgent)
}

// Screen size utilities
export const getScreenSize = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight
  }
}

export const getBreakpoint = () => {
  const width = window.innerWidth
  
  if (width < 640) return 'sm'
  if (width < 768) return 'md'
  if (width < 1024) return 'lg'
  if (width < 1280) return 'xl'
  return '2xl'
}

// Touch event utilities
export const addTouchSupport = (element, options = {}) => {
  const {
    onTap,
    onDoubleTap,
    onLongPress,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    longPressDelay = 500,
    swipeThreshold = 50
  } = options
  
  let touchStartX = 0
  let touchStartY = 0
  let touchStartTime = 0
  let longPressTimer = null
  let lastTapTime = 0
  
  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    touchStartTime = Date.now()
    
    // Set up long press detection
    if (onLongPress) {
      longPressTimer = setTimeout(() => {
        onLongPress(e)
      }, longPressDelay)
    }
  }
  
  const handleTouchMove = (e) => {
    // Cancel long press if finger moves
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }
  
  const handleTouchEnd = (e) => {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    
    const touch = e.changedTouches[0]
    const touchEndX = touch.clientX
    const touchEndY = touch.clientY
    const touchDuration = Date.now() - touchStartTime
    
    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Handle swipe gestures
    if (distance > swipeThreshold) {
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
      
      if (angle > -45 && angle <= 45 && onSwipeRight) {
        onSwipeRight(e)
      } else if (angle > 45 && angle <= 135 && onSwipeDown) {
        onSwipeDown(e)
      } else if ((angle > 135 || angle <= -135) && onSwipeLeft) {
        onSwipeLeft(e)
      } else if (angle > -135 && angle <= -45 && onSwipeUp) {
        onSwipeUp(e)
      }
      return
    }
    
    // Handle tap gestures
    if (touchDuration < 300 && distance < 10) {
      const currentTime = Date.now()
      
      if (onDoubleTap && currentTime - lastTapTime < 300) {
        onDoubleTap(e)
      } else if (onTap) {
        onTap(e)
      }
      
      lastTapTime = currentTime
    }
  }
  
  element.addEventListener('touchstart', handleTouchStart, { passive: false })
  element.addEventListener('touchmove', handleTouchMove, { passive: false })
  element.addEventListener('touchend', handleTouchEnd, { passive: false })
  
  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
    if (longPressTimer) {
      clearTimeout(longPressTimer)
    }
  }
}

// Viewport utilities
export const preventZoom = () => {
  document.addEventListener('touchmove', (e) => {
    if (e.scale !== 1) {
      e.preventDefault()
    }
  }, { passive: false })
  
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault()
  })
}

export const setViewportHeight = () => {
  // Fix for mobile viewport height issues
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

// Orientation utilities
export const getOrientation = () => {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
}

export const onOrientationChange = (callback) => {
  const handleOrientationChange = () => {
    // Delay to ensure dimensions are updated
    setTimeout(() => {
      setViewportHeight()
      callback(getOrientation())
    }, 100)
  }
  
  window.addEventListener('orientationchange', handleOrientationChange)
  window.addEventListener('resize', handleOrientationChange)
  
  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange)
    window.removeEventListener('resize', handleOrientationChange)
  }
}

// Haptic feedback (iOS only)
export const hapticFeedback = (type = 'light') => {
  if (window.navigator && window.navigator.vibrate) {
    // Android vibration
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [50, 50, 50]
    }
    window.navigator.vibrate(patterns[type] || patterns.light)
  }
  
  // iOS haptic feedback (requires user gesture)
  if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
    // This would need to be called from a user gesture
    // Implementation depends on specific iOS haptic API
  }
}

// Safe area utilities for notched devices
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement)
  
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0'),
    right: parseInt(style.getPropertyValue('--sar') || '0'),
    bottom: parseInt(style.getPropertyValue('--sab') || '0'),
    left: parseInt(style.getPropertyValue('--sal') || '0')
  }
}

// Performance utilities for mobile
export const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export const debounce = (func, wait, immediate) => {
  let timeout
  return function() {
    const context = this
    const args = arguments
    const later = function() {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
}

// Initialize mobile optimizations
export const initMobileOptimizations = () => {
  // Set initial viewport height
  setViewportHeight()
  
  // Handle orientation changes
  onOrientationChange((orientation) => {
    console.log('Orientation changed to:', orientation)
  })
  
  // Prevent zoom on double tap for form inputs
  if (isMobile()) {
    const inputs = document.querySelectorAll('input, select, textarea')
    inputs.forEach(input => {
      input.addEventListener('touchend', (e) => {
        e.preventDefault()
        input.focus()
      })
    })
  }
  
  // Add mobile-specific CSS classes
  document.documentElement.classList.add(
    isMobile() ? 'is-mobile' : 'is-desktop',
    isTablet() ? 'is-tablet' : 'is-phone',
    isIOS() ? 'is-ios' : 'is-android'
  )
}

// Pull-to-refresh implementation
export const addPullToRefresh = (element, onRefresh, options = {}) => {
  const {
    threshold = 80,
    resistance = 2.5,
    distanceToRefresh = 60
  } = options
  
  let startY = 0
  let currentY = 0
  let pulling = false
  let refreshing = false
  
  const handleTouchStart = (e) => {
    if (element.scrollTop === 0) {
      startY = e.touches[0].clientY
      pulling = true
    }
  }
  
  const handleTouchMove = (e) => {
    if (!pulling || refreshing) return
    
    currentY = e.touches[0].clientY
    const distance = (currentY - startY) / resistance
    
    if (distance > 0) {
      e.preventDefault()
      element.style.transform = `translateY(${Math.min(distance, threshold)}px)`
      
      if (distance > distanceToRefresh) {
        element.classList.add('pull-to-refresh-ready')
      } else {
        element.classList.remove('pull-to-refresh-ready')
      }
    }
  }
  
  const handleTouchEnd = async () => {
    if (!pulling) return
    
    pulling = false
    const distance = (currentY - startY) / resistance
    
    if (distance > distanceToRefresh && !refreshing) {
      refreshing = true
      element.classList.add('pull-to-refresh-loading')
      
      try {
        await onRefresh()
      } finally {
        refreshing = false
        element.classList.remove('pull-to-refresh-loading', 'pull-to-refresh-ready')
        element.style.transform = ''
      }
    } else {
      element.style.transform = ''
      element.classList.remove('pull-to-refresh-ready')
    }
  }
  
  element.addEventListener('touchstart', handleTouchStart, { passive: false })
  element.addEventListener('touchmove', handleTouchMove, { passive: false })
  element.addEventListener('touchend', handleTouchEnd)
  
  return () => {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
  }
}