import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ResponsiveTable from '../ResponsiveTable'

// Mock the isMobile function
jest.mock('../../utils/mobileUtils', () => ({
  isMobile: jest.fn()
}))

// Import the mocked function
import { isMobile } from '../../utils/mobileUtils'

describe('ResponsiveTable Component', () => {
  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <span data-testid={`status-${row.id}`}>
          {row.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ]
  
  const data = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'inactive' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor', status: 'active' }
  ]
  
  beforeEach(() => {
    // Reset the mock
    isMobile.mockReset()
  })
  
  test('renders table view on desktop', () => {
    // Mock as desktop
    isMobile.mockReturnValue(false)
    
    render(<ResponsiveTable columns={columns} data={data} />)
    
    // Check if table is rendered
    expect(screen.getByRole('table')).toBeInTheDocument()
    
    // Check headers
    columns.forEach(column => {
      expect(screen.getByText(column.header)).toBeInTheDocument()
    })
    
    // Check data
    data.forEach(item => {
      expect(screen.getByText(item.name)).toBeInTheDocument()
      expect(screen.getByText(item.email)).toBeInTheDocument()
      expect(screen.getByText(item.role)).toBeInTheDocument()
    })
    
    // Check custom render function
    expect(screen.getByTestId('status-1')).toHaveTextContent('Active')
    expect(screen.getByTestId('status-2')).toHaveTextContent('Inactive')
  })
  
  test('renders card view on mobile', () => {
    // Mock as mobile
    isMobile.mockReturnValue(true)
    
    render(<ResponsiveTable columns={columns} data={data} />)
    
    // Check if cards are rendered instead of table
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    
    // Check that each card contains the data
    data.forEach(item => {
      const cardElement = screen.getByText(item.name).closest('div')
      expect(cardElement).toHaveClass('bg-white')
      
      // Check that the card contains all column headers
      columns.forEach(column => {
        expect(cardElement).toContainElement(screen.getAllByText(column.header)[0])
      })
    })
  })
  
  test('handles row click', () => {
    const handleRowClick = jest.fn()
    
    // Mock as desktop
    isMobile.mockReturnValue(false)
    
    render(<ResponsiveTable columns={columns} data={data} onRowClick={handleRowClick} />)
    
    // Click on a row
    fireEvent.click(screen.getByText('John Doe'))
    
    // Check if handler was called with the row data
    expect(handleRowClick).toHaveBeenCalledWith(data[0])
  })
  
  test('shows empty message when no data', () => {
    render(<ResponsiveTable columns={columns} data={[]} emptyMessage="No users found" />)
    
    expect(screen.getByText('No users found')).toBeInTheDocument()
  })
  
  test('shows loading state', () => {
    render(<ResponsiveTable columns={columns} data={data} isLoading={true} />)
    
    // Check for loading indicator
    expect(screen.getByRole('status')).toBeInTheDocument()
    
    // Data should not be rendered while loading
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })
  
  test('handles sorting when clicking on column headers', () => {
    // Mock as desktop
    isMobile.mockReturnValue(false)
    
    render(<ResponsiveTable columns={columns} data={data} sortable={true} />)
    
    // Click on Name header to sort
    fireEvent.click(screen.getByText('Name'))
    
    // Check if sorted indicator is shown
    expect(screen.getByText('Name').textContent).toContain('↑')
    
    // Click again to reverse sort
    fireEvent.click(screen.getByText('Name'))
    
    // Check if sorted indicator is updated
    expect(screen.getByText('Name').textContent).toContain('↓')
  })
  
  test('handles pagination', () => {
    // Create more data to trigger pagination
    const moreData = Array(15).fill().map((_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: 'User',
      status: i % 2 === 0 ? 'active' : 'inactive'
    }))
    
    // Mock as desktop
    isMobile.mockReturnValue(false)
    
    render(
      <ResponsiveTable 
        columns={columns} 
        data={moreData} 
        pagination={true}
        itemsPerPage={5}
      />
    )
    
    // Check if pagination controls are rendered
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText('Previous')).toBeInTheDocument()
    
    // First page should show first 5 items
    expect(screen.getByText('User 1')).toBeInTheDocument()
    expect(screen.getByText('User 5')).toBeInTheDocument()
    expect(screen.queryByText('User 6')).not.toBeInTheDocument()
    
    // Click next page
    fireEvent.click(screen.getByText('Next'))
    
    // Second page should show next 5 items
    expect(screen.queryByText('User 1')).not.toBeInTheDocument()
    expect(screen.getByText('User 6')).toBeInTheDocument()
    expect(screen.getByText('User 10')).toBeInTheDocument()
  })
})