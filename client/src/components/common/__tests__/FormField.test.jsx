import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormField from '../FormField';

// Mock the child components
jest.mock('../TouchInput', () => {
  const mockReact = require('react');
  return mockReact.forwardRef(({ onChange, onBlur, error, ...props }, ref) => (
    mockReact.createElement('input', {
      ref,
      onChange,
      onBlur,
      'data-testid': 'touch-input',
      'data-error': error,
      ...props
    })
  ));
});

jest.mock('../TouchSelect', () => {
  const mockReact = require('react');
  return mockReact.forwardRef(({ onChange, onBlur, options = [], error, ...props }, ref) => (
    mockReact.createElement('select', {
      ref,
      onChange,
      onBlur,
      'data-testid': 'touch-select',
      'data-error': error,
      ...props
    }, options.map(option => 
      mockReact.createElement('option', {
        key: option.value,
        value: option.value
      }, option.label)
    ))
  ));
});

jest.mock('../SearchableSelect', () => {
  const mockReact = require('react');
  return mockReact.forwardRef(({ onChange, options, error, ...props }, ref) => (
    mockReact.createElement('div', {
      ref,
      'data-testid': 'searchable-select',
      'data-error': error,
      onClick: () => onChange && onChange('test-value'),
      ...props
    }, 'Searchable Select')
  ));
});

describe('FormField Component', () => {
  const defaultProps = {
    name: 'testField',
    label: 'Test Field',
    value: '',
    onChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with basic props', () => {
      render(<FormField {...defaultProps} />);
      
      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
      expect(screen.getByTestId('touch-input')).toBeInTheDocument();
    });

    it('renders required field indicator', () => {
      render(<FormField {...defaultProps} required />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders help text', () => {
      const helpText = 'This is help text';
      render(<FormField {...defaultProps} help={helpText} />);
      
      expect(screen.getByText(helpText)).toBeInTheDocument();
    });

    it('renders tooltip when provided', () => {
      const tooltipText = 'This is a tooltip';
      render(<FormField {...defaultProps} tooltip={tooltipText} />);
      
      const tooltipButton = screen.getByLabelText('Field help');
      expect(tooltipButton).toBeInTheDocument();
      
      // Check tooltip content is in DOM (even if hidden)
      expect(screen.getByText(tooltipText)).toBeInTheDocument();
    });
  });

  describe('Field Types', () => {
    it('renders text input by default', () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByTestId('touch-input')).toBeInTheDocument();
    });

    it('renders select field', () => {
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' }
      ];
      render(<FormField {...defaultProps} type="select" options={options} />);
      expect(screen.getByTestId('touch-select')).toBeInTheDocument();
    });

    it('renders multiselect field', () => {
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' }
      ];
      render(<FormField {...defaultProps} type="multiselect" options={options} />);
      expect(screen.getByTestId('searchable-select')).toBeInTheDocument();
    });

    it('renders textarea field', () => {
      render(<FormField {...defaultProps} type="textarea" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders checkbox field', () => {
      render(<FormField {...defaultProps} type="checkbox" />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });
  });

  describe('Field State Management', () => {
    it('tracks dirty state when field is modified', async () => {
      const user = userEvent.setup();
      render(<FormField {...defaultProps} />);
      
      const input = screen.getByTestId('touch-input');
      await user.type(input, 'test');
      
      // In development mode, state info should be visible
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Re-render to see debug info
      render(<FormField {...defaultProps} />);
      await user.type(screen.getByTestId('touch-input'), 'test');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('tracks touched state on blur', async () => {
      const user = userEvent.setup();
      render(<FormField {...defaultProps} />);
      
      const input = screen.getByTestId('touch-input');
      await user.click(input);
      await user.tab(); // This should trigger blur
      
      // Field should now be touched
      expect(input).not.toHaveFocus();
    });
  });

  describe('Validation', () => {
    it('shows required field error', async () => {
      const user = userEvent.setup();
      render(<FormField {...defaultProps} required />);
      
      const input = screen.getByTestId('touch-input');
      await user.click(input);
      await user.tab(); // Trigger blur validation
      
      await waitFor(() => {
        expect(screen.getByText('Test Field is required')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      render(<FormField {...defaultProps} type="email" />);
      
      const input = screen.getByTestId('touch-input');
      await user.type(input, 'invalid-email');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('validates phone number format', async () => {
      const user = userEvent.setup();
      render(<FormField {...defaultProps} type="tel" />);
      
      const input = screen.getByTestId('touch-input');
      await user.type(input, 'invalid-phone');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
      });
    });

    it('validates URL format', async () => {
      const user = userEvent.setup();
      render(<FormField {...defaultProps} type="url" />);
      
      const input = screen.getByTestId('touch-input');
      await user.type(input, 'invalid-url');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
      });
    });

    it('validates with custom validation rules', async () => {
      const user = userEvent.setup();
      const validationRules = {
        minLength: 5,
        maxLength: 10
      };
      
      render(<FormField {...defaultProps} validationRules={validationRules} />);
      
      const input = screen.getByTestId('touch-input');
      await user.type(input, 'abc');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Minimum 5 characters required')).toBeInTheDocument();
      });
    });

    it('validates with custom validation function', async () => {
      const user = userEvent.setup();
      const customValidate = jest.fn().mockResolvedValue('Custom error message');
      
      render(<FormField {...defaultProps} validate={customValidate} />);
      
      const input = screen.getByTestId('touch-input');
      await user.type(input, 'test');
      await user.tab();
      
      await waitFor(() => {
        expect(customValidate).toHaveBeenCalledWith('test', undefined);
        expect(screen.getByText('Custom error message')).toBeInTheDocument();
      });
    });

    it('shows validation icons when enabled', async () => {
      const user = userEvent.setup();
      render(<FormField {...defaultProps} required showValidationIcon />);
      
      const input = screen.getByTestId('touch-input');
      await user.click(input);
      await user.tab();
      
      await waitFor(() => {
        // Should show error icon
        const errorIcon = screen.getByRole('alert').querySelector('svg');
        expect(errorIcon).toBeInTheDocument();
      });
    });
  });

  describe('Dependencies', () => {
    it('hides field when dependencies are not met', () => {
      const formData = { otherField: 'wrong-value' };
      const props = {
        ...defaultProps,
        dependencies: ['otherField'],
        dependsOn: { otherField: 'correct-value' },
        formData
      };
      
      render(<FormField {...props} />);
      
      expect(screen.queryByLabelText('Test Field')).not.toBeInTheDocument();
    });

    it('shows field when dependencies are met', () => {
      const formData = { otherField: 'correct-value' };
      const props = {
        ...defaultProps,
        dependencies: ['otherField'],
        dependsOn: { otherField: 'correct-value' },
        formData
      };
      
      render(<FormField {...props} />);
      
      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    });

    it('handles array dependencies', () => {
      const formData = { otherField: 'value1' };
      const props = {
        ...defaultProps,
        dependencies: ['otherField'],
        dependsOn: { otherField: ['value1', 'value2'] },
        formData
      };
      
      render(<FormField {...props} />);
      
      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays external error prop', () => {
      const errorMessage = 'External error message';
      render(<FormField {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('prioritizes external error over validation error', async () => {
      const user = userEvent.setup();
      const externalError = 'External error';
      
      render(<FormField {...defaultProps} required error={externalError} />);
      
      const input = screen.getByTestId('touch-input');
      await user.click(input);
      await user.tab();
      
      // Should show external error, not validation error
      expect(screen.getByText(externalError)).toBeInTheDocument();
      expect(screen.queryByText('Test Field is required')).not.toBeInTheDocument();
    });

    it('shows help text when no error is present', () => {
      const helpText = 'Help text';
      render(<FormField {...defaultProps} help={helpText} />);
      
      expect(screen.getByText(helpText)).toBeInTheDocument();
    });

    it('hides help text when error is present', () => {
      const helpText = 'Help text';
      const errorText = 'Error text';
      render(<FormField {...defaultProps} help={helpText} error={errorText} />);
      
      expect(screen.getByText(errorText)).toBeInTheDocument();
      expect(screen.queryByText(helpText)).not.toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('calls onChange handler', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<FormField {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByTestId('touch-input');
      await user.type(input, 'test');
      
      expect(onChange).toHaveBeenCalled();
    });

    it('calls onBlur handler when provided', async () => {
      const user = userEvent.setup();
      const onBlur = jest.fn();
      render(<FormField {...defaultProps} onBlur={onBlur} />);
      
      const input = screen.getByTestId('touch-input');
      await user.click(input);
      await user.tab();
      
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for errors', async () => {
      const user = userEvent.setup();
      render(<FormField {...defaultProps} required />);
      
      const input = screen.getByTestId('touch-input');
      await user.click(input);
      await user.tab();
      
      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('has proper label association', () => {
      render(<FormField {...defaultProps} />);
      
      const input = screen.getByTestId('touch-input');
      const label = screen.getByText('Test Field');
      
      expect(input).toHaveAttribute('id', 'field-testField');
      expect(label.closest('label')).toHaveAttribute('for', 'field-testField');
    });
  });
});