import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../../context/AuthContext'
import UserList from '../UserList'
import { userService } from '../../../services/userService'

// Mock the user service
jest.mock('../../../services/userService')

// Mock react-router-dom
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: jest.fn(({ children, to, ...props }) => <a href={to} {...props}>{children}</a>)
}))

// Mock data
const mockUsers = [
  {
    _id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'department_staff',
    department: { _id: 'dept1', name: 'Design', code: 'DES' },
    isActive: true,
    lastLogin: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'department_admin',
    department: { _id: 'dept2', name: 'Video', code: 'VID' },
    isActive: false,
    lastLogin: null,
    createdAt: '2024-01-02T00:00:00Z'
  }
]

const mockPagination = {
  currentPage: 1,
  totalPages: 1,
  totalUsers: 2,
  hasNextPage: false,
  hasPrevPage: false,
  limit: 10
}

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('UserList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    userService.getUsers.mockResolvedValue({
      data: mockUsers,
      pagination: mockPagination
    })
  })

  it('renders user list correctly', async () => {
    renderWithProviders(<UserList />)

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    // Check if users are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('handles search functionality', async () => {
    renderWithProviders(<UserList />)

    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    // Find and interact with search input
    const searchInput = screen.getByPlaceholderText('Search users...')
    fireEvent.change(searchInput, { target: { value: 'john' } })

    // Verify that getUsers was called with search parameter
    await waitFor(() => {
      expect(userService.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'john',
          page: 1
        })
      )
    })
  })

  it('handles role filter', async () => {
    renderWithProviders(<UserList />)

    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    // Find role filter dropdown
    const roleSelect = screen.getByDisplayValue('All Roles')
    fireEvent.change(roleSelect, { target: { value: 'department_admin' } })

    // Verify that getUsers was called with role filter
    await waitFor(() => {
      expect(userService.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'department_admin',
          page: 1
        })
      )
    })
  })

  it('displays user status correctly', async () => {
    renderWithProviders(<UserList />)

    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    // Check status badges in table rows (not filter options)
    const statusBadges = screen.getAllByText('Active')
    const inactiveStatusBadges = screen.getAllByText('Inactive')
    
    // Should have at least one active and one inactive status in the table
    expect(statusBadges.length).toBeGreaterThan(1) // One in filter, one in table
    expect(inactiveStatusBadges.length).toBeGreaterThan(1) // One in filter, one in table
  })

  it('displays role badges with correct formatting', async () => {
    renderWithProviders(<UserList />)

    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    // Check role badges in table (not filter options)
    const departmentStaffBadges = screen.getAllByText('Department Staff')
    const departmentAdminBadges = screen.getAllByText('Department Admin')
    
    // Should have at least one of each role in the table
    expect(departmentStaffBadges.length).toBeGreaterThan(1) // One in filter, one in table
    expect(departmentAdminBadges.length).toBeGreaterThan(1) // One in filter, one in table
  })

  it('handles error state', async () => {
    const errorMessage = 'Failed to fetch users'
    userService.getUsers.mockRejectedValue(new Error(errorMessage))

    renderWithProviders(<UserList />)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('shows add user button', async () => {
    renderWithProviders(<UserList />)

    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add User')
    expect(addButton.closest('a')).toHaveAttribute('href', '/users/new')
  })

  it('handles pagination', async () => {
    const mockPaginationWithPages = {
      ...mockPagination,
      totalPages: 3,
      currentPage: 2,
      hasNextPage: true,
      hasPrevPage: true
    }

    userService.getUsers.mockResolvedValue({
      data: mockUsers,
      pagination: mockPaginationWithPages
    })

    renderWithProviders(<UserList />)

    await waitFor(() => {
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    })
  })
})