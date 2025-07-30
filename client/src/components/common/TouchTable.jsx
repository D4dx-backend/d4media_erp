import React, { useState, useEffect } from 'react'
import clsx from 'clsx'
import { isMobile } from '../../utils/mobileUtils'

const TouchTable = ({
  columns,
  data,
  onRowClick,
  onRowSwipe,
  emptyMessage = 'No data available',
  isLoading = false,
  className = '',
  rowClassName = '',
  headerClassName = '',
  cellClassName = '',
  ...props
}) => {
  const [isMobileView, setIsMobileView] = useState(false)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchEndX, setTouchEndX] = useState(0)
  const [activeRowIndex, setActiveRowIndex] = useState(null)
  const [swipeDirection, setSwipeDirection] = useState(null)
  
  useEffect(() => {
    // Check if mobile on mount and on resize
    const checkMobile = () => {
      setIsMobileView(isMobile() || window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Handle touch events for swipe actions
  const handleTouchStart = (e, rowIndex) => {
    if (!onRowSwipe) return
    
    setTouchStartX(e.touches[0].clientX)
    setActiveRowIndex(rowIndex)
    setSwipeDirection(null)
  }

  const handleTouchMove = (e) => {
    if (!onRowSwipe || activeRowIndex === null) return
    
    setTouchEndX(e.touches[0].clientX)
    const swipeDistance = touchEndX - touchStartX
    
    if (Math.abs(swipeDistance) > 30) {
      setSwipeDirection(swipeDistance > 0 ? 'right' : 'left')
    } else {
      setSwipeDirection(null)
    }
  }

  const handleTouchEnd = () => {
    if (!onRowSwipe || activeRowIndex === null || !swipeDirection) {
      setActiveRowIndex(null)
      return
    }
    
    const swipeDistance = touchEndX - touchStartX
    
    // If swiped far enough, trigger action
    if (Math.abs(swipeDistance) > 100) {
      onRowSwipe(data[activeRowIndex], swipeDirection)
    }
    
    setActiveRowIndex(null)
    setSwipeDirection(null)
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Render empty state
  if (!data.length) {
    return (
      <div className="flex justify-center items-center p-8 text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  // Render mobile card view
  if (isMobileView) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {data.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={clsx(
                'bg-white rounded-lg shadow p-4 border-l-4 border-blue-500 transition-transform',
                rowClassName,
                onRowClick && 'active:bg-gray-50',
                swipeDirection && activeRowIndex === rowIndex && 
                  (swipeDirection === 'left' ? 'border-l-red-500' : 'border-l-green-500')
              )}
              style={{
                transform: activeRowIndex === rowIndex && swipeDirection
                  ? `translateX(${(touchEndX - touchStartX) * 0.5}px)`
                  : 'translateX(0)',
                transition: activeRowIndex === rowIndex ? 'none' : 'transform 0.2s ease-out'
              }}
              onClick={() => onRowClick && onRowClick(row)}
              onTouchStart={(e) => handleTouchStart(e, rowIndex)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="py-2 flex justify-between">
                  <div className="font-medium text-gray-700">{column.header}</div>
                  <div className={clsx('text-right', cellClassName)}>
                    {column.render ? column.render(row) : row[column.accessor]}
                  </div>
                </div>
              ))}
              
              {/* Swipe hint indicators */}
              {onRowSwipe && (
                <>
                  <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-green-500 to-transparent opacity-0"></div>
                  <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-red-500 to-transparent opacity-0"></div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render desktop table view with touch-friendly rows
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={clsx(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  headerClassName
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={clsx(
                rowClassName,
                onRowClick && 'cursor-pointer hover:bg-gray-50 active:bg-gray-100'
              )}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={clsx(
                    'px-6 py-4 whitespace-nowrap min-h-[48px]',
                    cellClassName
                  )}
                >
                  {column.render ? column.render(row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TouchTable