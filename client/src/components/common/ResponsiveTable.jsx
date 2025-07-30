import React, { useState, useEffect } from 'react'
import clsx from 'clsx'
import { isMobile } from '../../utils/mobileUtils'

const ResponsiveTable = ({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
  isLoading = false,
  className = '',
  rowClassName = '',
  headerClassName = '',
  cellClassName = '',
  sortable = true,
  pagination = true,
  itemsPerPage = 10,
  currentPage: controlledPage,
  onPageChange: controlledPageChange,
  ...props
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobileView, setIsMobileView] = useState(false)
  
  // Check if pagination is controlled externally
  const isControlled = controlledPage !== undefined && controlledPageChange !== undefined
  const activePage = isControlled ? controlledPage : currentPage
  
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

  // Sort data based on current sort configuration
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || !sortable) return data
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (aValue === bValue) return 0
      
      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return sortConfig.direction === 'asc'
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1
    })
  }, [data, sortConfig, sortable])

  // Handle sorting
  const handleSort = (key) => {
    if (!sortable) return
    
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }
      }
      return { key, direction: 'asc' }
    })
  }

  // Handle pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  
  const handlePageChange = (page) => {
    if (isControlled) {
      controlledPageChange(page)
    } else {
      setCurrentPage(page)
    }
  }
  
  const paginatedData = pagination
    ? sortedData.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage)
    : sortedData

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
          {paginatedData.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={clsx(
                'bg-white rounded-lg shadow p-4 border-l-4 border-blue-500',
                rowClassName,
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="py-2 flex justify-between">
                  <div className="font-medium text-gray-700">{column.header}</div>
                  <div className={clsx('text-right', cellClassName)}>
                    {column.render ? column.render(row) : row[column.accessor]}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {pagination && totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <PaginationControls
              currentPage={activePage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    )
  }

  // Render desktop table view
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
                  sortable && column.sortable !== false && 'cursor-pointer hover:bg-gray-100',
                  headerClassName
                )}
                onClick={() => column.sortable !== false && handleSort(column.accessor)}
              >
                <div className="flex items-center">
                  {column.header}
                  {sortable && column.sortable !== false && sortConfig.key === column.accessor && (
                    <span className="ml-2">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={clsx(
                rowClassName,
                onRowClick && 'cursor-pointer hover:bg-gray-50'
              )}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={clsx('px-6 py-4 whitespace-nowrap', cellClassName)}
                >
                  {column.render ? column.render(row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {pagination && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <PaginationControls
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    
    // Always show first page
    pages.push(1)
    
    // Calculate range around current page
    let rangeStart = Math.max(2, currentPage - 1)
    let rangeEnd = Math.min(totalPages - 1, currentPage + 1)
    
    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pages.push('...')
    }
    
    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i)
    }
    
    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages - 1) {
      pages.push('...')
    }
    
    // Always show last page if more than one page
    if (totalPages > 1) {
      pages.push(totalPages)
    }
    
    return pages
  }
  
  const pageNumbers = getPageNumbers()
  
  return (
    <nav className="flex items-center">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={clsx(
          'min-h-[44px] min-w-[44px] px-3 py-2 rounded-md',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-600 hover:bg-blue-50'
        )}
      >
        Previous
      </button>
      
      <div className="flex mx-2">
        {pageNumbers.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="min-h-[44px] min-w-[44px] px-3 py-2 flex items-center justify-center">
                ...
              </span>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                className={clsx(
                  'min-h-[44px] min-w-[44px] px-3 py-2 rounded-md',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-600 hover:bg-blue-50'
                )}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={clsx(
          'min-h-[44px] min-w-[44px] px-3 py-2 rounded-md',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-600 hover:bg-blue-50'
        )}
      >
        Next
      </button>
    </nav>
  )
}

export default ResponsiveTable