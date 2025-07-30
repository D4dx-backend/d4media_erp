import React, { useRef, useState, useEffect } from 'react'
import clsx from 'clsx'
import { isMobile } from '../../utils/mobileUtils'

const PullToRefresh = ({
  onRefresh,
  children,
  pullDownThreshold = 80,
  maxPullDownDistance = 120,
  refreshingContent = null,
  pullingContent = null,
  className = '',
  disabled = false,
  ...props
}) => {
  const containerRef = useRef(null)
  const [state, setState] = useState({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    isMobile: false
  })

  useEffect(() => {
    // Check if mobile on mount
    setState(prev => ({ ...prev, isMobile: isMobile() }))
  }, [])

  // Don't apply pull-to-refresh on desktop
  if (!state.isMobile) {
    return <div className={className} {...props}>{children}</div>
  }

  // Touch event handlers
  const handleTouchStart = (e) => {
    if (disabled || state.isRefreshing) return
    
    // Only enable pull-to-refresh when scrolled to top
    if (containerRef.current && containerRef.current.scrollTop > 0) return
    
    setState(prev => ({
      ...prev,
      isPulling: true,
      startY: e.touches[0].clientY
    }))
  }

  const handleTouchMove = (e) => {
    if (!state.isPulling || disabled || state.isRefreshing) return
    
    const touchY = e.touches[0].clientY
    const pullDistance = Math.max(0, touchY - state.startY)
    
    // Apply resistance to make pull feel natural
    const resistance = 0.4
    const adjustedDistance = Math.min(
      maxPullDownDistance,
      pullDistance * resistance
    )
    
    setState(prev => ({
      ...prev,
      pullDistance: adjustedDistance
    }))
    
    // Prevent default scrolling when pulling
    if (pullDistance > 0) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = async () => {
    if (!state.isPulling || disabled) return
    
    setState(prev => ({ ...prev, isPulling: false }))
    
    // If pulled past threshold, trigger refresh
    if (state.pullDistance >= pullDownThreshold) {
      setState(prev => ({ ...prev, isRefreshing: true, pullDistance: 0 }))
      
      try {
        await onRefresh()
      } finally {
        setState(prev => ({ ...prev, isRefreshing: false }))
      }
    } else {
      // Reset pull distance with animation
      setState(prev => ({ ...prev, pullDistance: 0 }))
    }
  }

  // Default refreshing indicator
  const defaultRefreshingContent = (
    <div className="flex justify-center items-center h-16 text-blue-600">
      <svg className="animate-spin h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Refreshing...</span>
    </div>
  )

  // Default pulling indicator
  const defaultPullingContent = (
    <div className="flex justify-center items-center h-16 text-blue-600">
      <svg 
        className={clsx(
          "h-6 w-6 mr-2 transition-transform",
          state.pullDistance >= pullDownThreshold ? "rotate-180" : ""
        )} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
      <span>
        {state.pullDistance >= pullDownThreshold ? 'Release to refresh' : 'Pull down to refresh'}
      </span>
    </div>
  )

  return (
    <div 
      className={clsx('relative overflow-hidden', className)}
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {/* Pull indicator */}
      <div 
        className={clsx(
          'absolute left-0 right-0 flex justify-center items-center transition-transform',
          state.isRefreshing ? 'transform translate-y-0' : 'transform -translate-y-full'
        )}
        style={{
          transform: state.isPulling 
            ? `translateY(calc(-100% + ${state.pullDistance}px))` 
            : state.isRefreshing 
              ? 'translateY(0)' 
              : 'translateY(-100%)',
          transition: state.isPulling ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {state.isRefreshing 
          ? (refreshingContent || defaultRefreshingContent)
          : (pullingContent || defaultPullingContent)
        }
      </div>
      
      {/* Content container */}
      <div 
        className="transform transition-transform"
        style={{
          transform: state.isPulling || state.isRefreshing
            ? `translateY(${state.isRefreshing ? 64 : state.pullDistance}px)`
            : 'translateY(0)',
          transition: state.isPulling ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default PullToRefresh