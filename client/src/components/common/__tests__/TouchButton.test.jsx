import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import TouchButton from '../TouchButton'

describe('TouchButton Component', () => {
  test('renders with default props', () => {
    render(<TouchButton>Click me</TouchButton>)
    const button = screen.getByText('Click me')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-blue-600') // primary variant
  })

  test('renders with different variants', () => {
    const { rerender } = render(<TouchButton variant="secondary">Secondary</TouchButton>)
    expect(screen.getByText('Secondary')).toHaveClass('bg-gray-600')
    
    rerender(<TouchButton variant="success">Success</TouchButton>)
    expect(screen.getByText('Success')).toHaveClass('bg-green-600')
    
    rerender(<TouchButton variant="danger">Danger</TouchButton>)
    expect(screen.getByText('Danger')).toHaveClass('bg-red-600')
    
    rerender(<TouchButton variant="outline">Outline</TouchButton>)
    expect(screen.getByText('Outline')).toHaveClass('border-blue-600')
  })

  test('renders with different sizes', () => {
    const { rerender } = render(<TouchButton size="small">Small</TouchButton>)
    expect(screen.getByText('Small')).toHaveClass('min-h-[44px]')
    
    rerender(<TouchButton size="medium">Medium</TouchButton>)
    expect(screen.getByText('Medium')).toHaveClass('min-h-[48px]')
    
    rerender(<TouchButton size="large">Large</TouchButton>)
    expect(screen.getByText('Large')).toHaveClass('min-h-[56px]')
  })

  test('handles click events', () => {
    const handleClick = jest.fn()
    render(<TouchButton onClick={handleClick}>Click me</TouchButton>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('disables button when disabled prop is true', () => {
    const handleClick = jest.fn()
    render(<TouchButton disabled onClick={handleClick}>Disabled</TouchButton>)
    
    const button = screen.getByText('Disabled')
    expect(button).toBeDisabled()
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  test('shows loading state', () => {
    render(<TouchButton loading>Loading</TouchButton>)
    
    const button = screen.getByText('Loading')
    expect(button).toBeDisabled()
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  test('renders with icon', () => {
    const icon = <span data-testid="test-icon">🔍</span>
    render(<TouchButton icon={icon}>With Icon</TouchButton>)
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('With Icon')).toBeInTheDocument()
  })

  test('applies custom className', () => {
    render(<TouchButton className="custom-class">Custom Class</TouchButton>)
    expect(screen.getByText('Custom Class')).toHaveClass('custom-class')
  })

  test('handles touch events', () => {
    render(<TouchButton>Touch Button</TouchButton>)
    const button = screen.getByText('Touch Button')
    
    // Simulate touch start
    fireEvent.touchStart(button)
    expect(button).toHaveClass('scale-95', 'opacity-70')
    
    // Simulate touch end
    fireEvent.touchEnd(button)
    expect(button).not.toHaveClass('scale-95', 'opacity-70')
  })
})