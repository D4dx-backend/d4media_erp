import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import TouchForm from '../TouchForm'

describe('TouchForm Components', () => {
  describe('TouchInput', () => {
    test('renders with label and placeholder', () => {
      render(
        <TouchForm.Input
          label="Email"
          name="email"
          placeholder="Enter your email"
        />
      )
      
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    })
    
    test('handles value and onChange', () => {
      const handleChange = jest.fn()
      render(
        <TouchForm.Input
          label="Username"
          name="username"
          value="testuser"
          onChange={handleChange}
        />
      )
      
      const input = screen.getByLabelText('Username')
      expect(input).toHaveValue('testuser')
      
      fireEvent.change(input, { target: { value: 'newuser' } })
      expect(handleChange).toHaveBeenCalled()
    })
    
    test('shows required indicator', () => {
      render(
        <TouchForm.Input
          label="Password"
          name="password"
          required
        />
      )
      
      const label = screen.getByText('Password')
      expect(label.parentElement).toContainHTML('*')
    })
    
    test('shows error message', () => {
      render(
        <TouchForm.Input
          label="Email"
          name="email"
          error="Invalid email format"
        />
      )
      
      expect(screen.getByText('Invalid email format')).toBeInTheDocument()
    })
    
    test('applies disabled state', () => {
      render(
        <TouchForm.Input
          label="Username"
          name="username"
          disabled
        />
      )
      
      expect(screen.getByLabelText('Username')).toBeDisabled()
    })
  })
  
  describe('TouchSelect', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ]
    
    test('renders with options', () => {
      render(
        <TouchForm.Select
          label="Select Option"
          name="options"
          options={options}
        />
      )
      
      expect(screen.getByLabelText('Select Option')).toBeInTheDocument()
      
      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
      
      options.forEach(option => {
        expect(select).toContainHTML(option.label)
      })
    })
    
    test('handles value and onChange', () => {
      const handleChange = jest.fn()
      render(
        <TouchForm.Select
          label="Select Option"
          name="options"
          options={options}
          value="option2"
          onChange={handleChange}
        />
      )
      
      const select = screen.getByRole('combobox')
      expect(select.value).toBe('option2')
      
      fireEvent.change(select, { target: { value: 'option3' } })
      expect(handleChange).toHaveBeenCalled()
    })
    
    test('shows placeholder', () => {
      render(
        <TouchForm.Select
          label="Select Option"
          name="options"
          options={options}
          placeholder="Choose an option"
        />
      )
      
      const select = screen.getByRole('combobox')
      expect(select).toContainHTML('Choose an option')
    })
  })
  
  describe('TouchTextarea', () => {
    test('renders with label and placeholder', () => {
      render(
        <TouchForm.Textarea
          label="Comments"
          name="comments"
          placeholder="Enter your comments"
          rows={4}
        />
      )
      
      expect(screen.getByLabelText('Comments')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your comments')).toBeInTheDocument()
    })
    
    test('handles value and onChange', () => {
      const handleChange = jest.fn()
      render(
        <TouchForm.Textarea
          label="Comments"
          name="comments"
          value="Test comment"
          onChange={handleChange}
        />
      )
      
      const textarea = screen.getByLabelText('Comments')
      expect(textarea).toHaveValue('Test comment')
      
      fireEvent.change(textarea, { target: { value: 'New comment' } })
      expect(handleChange).toHaveBeenCalled()
    })
  })
  
  describe('TouchCheckbox', () => {
    test('renders with label', () => {
      render(
        <TouchForm.Checkbox
          label="Accept terms"
          name="terms"
        />
      )
      
      expect(screen.getByLabelText('Accept terms')).toBeInTheDocument()
    })
    
    test('handles checked state and onChange', () => {
      const handleChange = jest.fn()
      render(
        <TouchForm.Checkbox
          label="Subscribe"
          name="subscribe"
          checked={true}
          onChange={handleChange}
        />
      )
      
      const checkbox = screen.getByLabelText('Subscribe')
      expect(checkbox).toBeChecked()
      
      fireEvent.click(checkbox)
      expect(handleChange).toHaveBeenCalled()
    })
  })
  
  describe('TouchRadioGroup', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ]
    
    test('renders with options', () => {
      render(
        <TouchForm.RadioGroup
          label="Select One"
          name="radioOptions"
          options={options}
        />
      )
      
      expect(screen.getByText('Select One')).toBeInTheDocument()
      
      options.forEach(option => {
        expect(screen.getByLabelText(option.label)).toBeInTheDocument()
      })
    })
    
    test('handles selected value and onChange', () => {
      const handleChange = jest.fn()
      render(
        <TouchForm.RadioGroup
          label="Select One"
          name="radioOptions"
          options={options}
          value="option2"
          onChange={handleChange}
        />
      )
      
      const selectedOption = screen.getByLabelText('Option 2')
      expect(selectedOption).toBeChecked()
      
      const anotherOption = screen.getByLabelText('Option 3')
      fireEvent.click(anotherOption)
      expect(handleChange).toHaveBeenCalled()
    })
  })
})