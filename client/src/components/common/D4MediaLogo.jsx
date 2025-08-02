import React from 'react'

const D4MediaLogo = ({ size = 'md', showText = true, className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-24 h-24'
  }

  const gridSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-12 h-12'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg flex items-center justify-center`}>
        <div className={`grid grid-cols-2 gap-0.5 ${gridSizes[size]}`}>
          <div className="bg-blue-400 rounded-sm"></div>
          <div className="bg-blue-400 rounded-sm"></div>
          <div className="bg-blue-400 rounded-sm"></div>
          <div className="bg-blue-400 rounded-sm"></div>
        </div>
      </div>
      {showText && (
        <span className={`font-bold text-blue-800 ${textSizes[size]}`}>
          D4Media
        </span>
      )}
    </div>
  )
}

export default D4MediaLogo