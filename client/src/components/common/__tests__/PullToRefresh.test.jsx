import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import PullToRefresh from '../PullToRefresh'

// Mock the isMobile function
jest.mock('../../utils/mobileUtils', () => ({
  isMobile: jest.fn()
}))

// Import the mocked function
import { isMobile } from '../../utils/mobileUtils'

describe('PullToRefresh Component', () => {
  beforeEach(() => {
    // Reset the mock
    isMobile.mockReset()
  })
  
  test('renders children correctly', () => {
    // Mock as mobile
    isMobile.mockReturnValue(true)
    
    render(
      <PullToRefresh onRefresh={() => {}}>
        <div data-testid="content">Pull to refresh content</div>
      </PullToRefresh>
    )
    
    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.getByText('Pull to refresh content')).toBeInTheDocument()
  })
  
  test('does not apply pull-to-refresh on desktop', () => {
    // Mock as desktop
    isMobile.mockReturnValue(false)
    
    render(
      <PullToRefresh onRefresh={() => {}}>
        <div data-testid="content">Content</div>
      </PullToRefresh>
    )
    
    const content = screen.getByTestId('content')
    
    // Simulate touch events
    fireEvent.touchStart(content, { touches: [{ clientY: 0 }] })
    fireEvent.touchMove(content, { touches: [{ clientY: 100 }] })
    
    // No pull-to-refresh effect should be applied
    expect(content.parentElement.style.transform).not.toBe('translateY(100px)')
  })
  
  test('shows pull indicator on mobile when pulled down', () => {
    // Mock as mobile
    isMobile.mockReturnValue(true)
    
    render(
      <PullToRefresh onRefresh={() => {}}>
        <div data-testid="content">Content</div>
      </PullToRefresh>
    )
    
    const container = screen.getByTestId('content').parentElement
    
    // Simulate pull down
    fireEvent.touchStart(container, { 
      touches: [{ clientY: 0 }] 
    })
    
    fireEvent.touchMove(container, { 
      touches: [{ clientY: 100 }] 
    })
    
    // Check if pull indicator is visible
    expect(screen.getByText(/pull down to refresh/i)).toBeInTheDocument()
  })
  
  test('triggers refresh when pulled past threshold', async () => {
    // Mock as mobile
    isMobile.mockReturnValue(true)
    
    const handleRefresh = jest.fn().mockResolvedValue(undefined)
    
    render(
      <PullToRefresh 
        onRefresh={handleRefresh}
        pullDownThreshold={60}
      >
        <div data-testid="content">Content</div>
      </PullToRefresh>
    )
    
    const container = screen.getByTestId('content').parentElement
    
    // Simulate pull down past threshold
    fireEvent.touchStart(container, { 
      touches: [{ clientY: 0 }] 
    })
    
    fireEvent.touchMove(container, { 
      touches: [{ clientY: 200 }] 
    })
    
    // Check if release message is shown
    expect(screen.getByText(/release to refresh/i)).toBeInTheDocument()
    
    // Release to trigger refresh
    await act(async () => {
      fireEvent.touchEnd(container)
    })
    
    // Check if refresh was triggered
    expect(handleRefresh).toHaveBeenCalledTimes(1)
    
    // Check if refreshing indicator is shown
    expect(screen.getByText(/refreshing/i)).toBeInTheDocument()
  })
  
  test('does not trigger refresh when pulled less than threshold', () => {
    // Mock as mobile
    isMobile.mockReturnValue(true)
    
    const handleRefresh = jest.fn()
    
    render(
      <PullToRefresh 
        onRefresh={handleRefresh}
        pullDownThreshold={60}
      >
        <div data-testid="content">Content</div>
      </PullToRefresh>
    )
    
    const container = screen.getByTestId('content').parentElement
    
    // Simulate small pull down (less than threshold)
    fireEvent.touchStart(container, { 
      touches: [{ clientY: 0 }] 
    })
    
    fireEvent.touchMove(container, { 
      touches: [{ clientY: 30 }] 
    })
    
    fireEvent.touchEnd(container)
    
    // Check that refresh was not triggered
    expect(handleRefresh).not.toHaveBeenCalled()
  })
  
  test('accepts custom refreshing content', () => {
    // Mock as mobile
    isMobile.mockReturnValue(true)
    
    render(
      <PullToRefresh 
        onRefresh={() => {}}
        refreshingContent={<div data-testid="custom-refreshing">Custom Refreshing</div>}
      >
        <div>Content</div>
      </PullToRefresh>
    )
    
    const container = screen.getByText('Content').parentElement
    
    // Simulate pull down past threshold
    fireEvent.touchStart(container, { 
      touches: [{ clientY: 0 }] 
    })
    
    fireEvent.touchMove(container, { 
      touches: [{ clientY: 200 }] 
    })
    
    fireEvent.touchEnd(container)
    
    // Check if custom refreshing content is shown
    expect(screen.getByTestId('custom-refreshing')).toBeInTheDocument()
  })
  
  test('does not allow pull when disabled', () => {
    // Mock as mobile
    isMobile.mockReturnValue(true)
    
    const handleRefresh = jest.fn()
    
    render(
      <PullToRefresh 
        onRefresh={handleRefresh}
        disabled={true}
      >
        <div data-testid="content">Content</div>
      </PullToRefresh>
    )
    
    const container = screen.getByTestId('content').parentElement
    
    // Simulate pull down
    fireEvent.touchStart(container, { 
      touches: [{ clientY: 0 }] 
    })
    
    fireEvent.touchMove(container, { 
      touches: [{ clientY: 100 }] 
    })
    
    fireEvent.touchEnd(container)
    
    // Check that refresh was not triggered
    expect(handleRefresh).not.toHaveBeenCalled()
    
    // Pull indicator should not be visible
    expect(screen.queryByText(/pull down to refresh/i)).not.toBeInTheDocument()
  })
})