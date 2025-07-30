import React from 'react'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

// Import components to test
import TouchButton from '../TouchButton'
import TouchForm from '../TouchForm'
import ResponsiveTable from '../ResponsiveTable'
import PullToRefresh from '../PullToRefresh'
import TouchTable from '../TouchTable'
import TouchSelect from '../TouchSelect'

// Add jest-axe matchers
expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  test('TouchButton has no accessibility violations', async () => {
    const { container } = render(
      <TouchButton>Accessible Button</TouchButton>
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  test('TouchForm.Input has no accessibility violations', async () => {
    const { container } = render(
      <TouchForm.Input
        label="Email"
        name="email"
        placeholder="Enter your email"
        required
      />
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  test('TouchForm.Select has no accessibility violations', async () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ]
    
    const { container } = render(
      <TouchForm.Select
        label="Select Option"
        name="options"
        options={options}
        required
      />
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  test('TouchForm.Checkbox has no accessibility violations', async () => {
    const { container } = render(
      <TouchForm.Checkbox
        label="Accept terms"
        name="terms"
        required
      />
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  test('ResponsiveTable has no accessibility violations', async () => {
    const columns = [
      { header: 'Name', accessor: 'name' },
      { header: 'Email', accessor: 'email' }
    ]
    
    const data = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]
    
    const { container } = render(
      <ResponsiveTable
        columns={columns}
        data={data}
      />
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  test('TouchTable has no accessibility violations', async () => {
    const columns = [
      { header: 'Name', accessor: 'name' },
      { header: 'Email', accessor: 'email' }
    ]
    
    const data = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]
    
    const { container } = render(
      <TouchTable
        columns={columns}
        data={data}
      />
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  test('TouchSelect has no accessibility violations', async () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ]
    
    const { container } = render(
      <TouchSelect
        options={options}
        label="Select Option"
        name="options"
      />
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  test('PullToRefresh has no accessibility violations', async () => {
    const { container } = render(
      <PullToRefresh onRefresh={() => {}}>
        <div>Pull to refresh content</div>
      </PullToRefresh>
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
  
  test('Form with multiple inputs has no accessibility violations', async () => {
    const { container } = render(
      <form aria-labelledby="form-title">
        <h2 id="form-title">Contact Form</h2>
        <TouchForm.Input
          label="Name"
          name="name"
          required
        />
        <TouchForm.Input
          label="Email"
          name="email"
          type="email"
          required
        />
        <TouchForm.Textarea
          label="Message"
          name="message"
          required
        />
        <TouchForm.Checkbox
          label="Subscribe to newsletter"
          name="subscribe"
        />
        <TouchButton type="submit">Submit</TouchButton>
      </form>
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})