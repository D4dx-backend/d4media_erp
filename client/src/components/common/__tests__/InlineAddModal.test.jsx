import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InlineAddModal from '../InlineAddModal';

// Mock TouchButton component
jest.mock('../TouchButton', () => {
  return function TouchButton({ children, onClick, disabled, loading, ...props }) {
    return (
      <button onClick={onClick} disabled={disabled || loading} {...props}>
        {loading ? 'Loading...' : children}
      </button>
    );
  };
});

// Mock FormField component
jest.mock('../FormField', () => {
  const React = require('react');
  return React.forwardRef(function FormField({ 
    type, 
    label, 
    name, 
    value, 
    onChange, 
    error, 
    required,
    placeholder,
    options = [],
    autoFocus,
    ...props 
  }, ref) {
    const handleChange = (e) => {
      if (type === 'select' || type === 'multiselect') {
        onChange(e.target.value);
      } else {
        onChange(e);
      }
    };

    return (
      <div>
        <label htmlFor={name}>
          {label}
          {required && <span>*</span>}
        </label>
        {type === 'select' || type === 'multiselect' ? (
          <select
            ref={ref}
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            multiple={type === 'multiselect'}
            autoFocus={autoFocus}
            {...props}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            ref={ref}
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            autoFocus={autoFocus}
            {...props}
          />
        ) : (
          <input
            ref={ref}
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            autoFocus={autoFocus}
            {...props}
          />
        )}
        {error && <span role="alert">{error}</span>}
      </div>
    );
  });
});

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSubmit: jest.fn(),
  title: 'Test Modal',
  fields: [
    {
      type: 'text',
      label: 'Name',
      name: 'name',
      required: true,
      placeholder: 'Enter name'
    },
    {
      type: 'email',
      label: 'Email',
      name: 'email',
      placeholder: 'Enter email'
    }
  ]
};

describe('InlineAddModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body overflow style
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = '';
  });

  describe('Basic Functionality', () => {
    test('renders modal when isOpen is true', () => {
      render(<InlineAddModal {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    test('does not render modal when isOpen is false', () => {
      render(<InlineAddModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders all form fields', () => {
      render(<InlineAddModal {...defaultProps} />);
      
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    });

    test('shows required field indicators', () => {
      render(<InlineAddModal {...defaultProps} />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    test('handles form input changes', async () => {
      const user = userEvent.setup();
      render(<InlineAddModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/Name/);
      await user.type(nameInput, 'John Doe');
      
      expect(nameInput).toHaveValue('John Doe');
    });

    test('validates required fields on submit', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<InlineAddModal {...defaultProps} onSubmit={onSubmit} />);
      
      const submitButton = screen.getByText('Add');
      await user.click(submitButton);
      
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    test('validates email format', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      render(<InlineAddModal {...defaultProps} onSubmit={onSubmit} />);
      
      const nameInput = screen.getByLabelText(/Name/);
      const emailInput = screen.getByLabelText(/Email/);
      const submitButton = screen.getByText('Add');
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);
      
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    test('submits form with valid data', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn().mockResolvedValue();
      render(<InlineAddModal {...defaultProps} onSubmit={onSubmit} />);
      
      const nameInput = screen.getByLabelText(/Name/);
      const emailInput = screen.getByLabelText(/Email/);
      const submitButton = screen.getByText('Add');
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.click(submitButton);
      
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    test('clears field errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<InlineAddModal {...defaultProps} />);
      
      const submitButton = screen.getByText('Add');
      await user.click(submitButton);
      
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      
      const nameInput = screen.getByLabelText(/Name/);
      await user.type(nameInput, 'J');
      
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });
  });

  describe('Modal Controls', () => {
    test('closes modal when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<InlineAddModal {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Close modal');
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    test('closes modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<InlineAddModal {...defaultProps} onClose={onClose} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    test('closes modal when overlay is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<InlineAddModal {...defaultProps} onClose={onClose} />);
      
      const overlay = screen.getByRole('dialog');
      await user.click(overlay);
      
      expect(onClose).toHaveBeenCalled();
    });

    test('does not close modal when content is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<InlineAddModal {...defaultProps} onClose={onClose} />);
      
      const title = screen.getByText('Test Modal');
      await user.click(title);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    test('closes modal when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<InlineAddModal {...defaultProps} onClose={onClose} />);
      
      await user.keyboard('{Escape}');
      
      expect(onClose).toHaveBeenCalled();
    });

    test('does not close on overlay click when closeOnOverlayClick is false', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<InlineAddModal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />);
      
      const overlay = screen.getByRole('dialog');
      await user.click(overlay);
      
      expect(onClose).not.toHaveBeenCalled();
    });

    test('does not close on Escape when closeOnEscape is false', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<InlineAddModal {...defaultProps} onClose={onClose} closeOnEscape={false} />);
      
      await user.keyboard('{Escape}');
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    test('shows loading state during submission', () => {
      render(<InlineAddModal {...defaultProps} isSubmitting={true} />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('disables buttons during submission', () => {
      render(<InlineAddModal {...defaultProps} isSubmitting={true} />);
      
      const submitButton = screen.getByText('Loading...');
      const cancelButton = screen.getByText('Cancel');
      
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    test('prevents closing during submission', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<InlineAddModal {...defaultProps} onClose={onClose} isSubmitting={true} />);
      
      await user.keyboard('{Escape}');
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Size Variants', () => {
    test('applies small size classes', () => {
      render(<InlineAddModal {...defaultProps} size="sm" />);
      
      const modal = screen.getByRole('dialog').firstChild;
      expect(modal).toHaveClass('max-w-sm');
    });

    test('applies large size classes', () => {
      render(<InlineAddModal {...defaultProps} size="lg" />);
      
      const modal = screen.getByRole('dialog').firstChild;
      expect(modal).toHaveClass('max-w-lg');
    });

    test('applies extra large size classes', () => {
      render(<InlineAddModal {...defaultProps} size="xl" />);
      
      const modal = screen.getByRole('dialog').firstChild;
      expect(modal).toHaveClass('max-w-xl');
    });
  });

  describe('Icon and Styling', () => {
    test('renders icon when provided', () => {
      const icon = <span data-testid="test-icon">🎉</span>;
      render(<InlineAddModal {...defaultProps} icon={icon} />);
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    test('applies icon color classes', () => {
      const icon = <span>🎉</span>;
      render(<InlineAddModal {...defaultProps} icon={icon} iconColor="green" />);
      
      const iconContainer = screen.getByText('🎉').parentElement;
      expect(iconContainer).toHaveClass('bg-green-100', 'text-green-600');
    });

    test('hides close button when showCloseButton is false', () => {
      render(<InlineAddModal {...defaultProps} showCloseButton={false} />);
      
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });
  });

  describe('Field Types', () => {
    test('handles different field types', () => {
      const fields = [
        { type: 'text', label: 'Text Field', name: 'text' },
        { type: 'email', label: 'Email Field', name: 'email' },
        { type: 'tel', label: 'Phone Field', name: 'phone' },
        { type: 'number', label: 'Number Field', name: 'number' },
        { type: 'textarea', label: 'Textarea Field', name: 'textarea' },
        { type: 'select', label: 'Select Field', name: 'select', options: [
          { value: 'option1', label: 'Option 1' }
        ]}
      ];
      
      render(<InlineAddModal {...defaultProps} fields={fields} />);
      
      expect(screen.getByLabelText(/Text Field/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Field/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone Field/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Number Field/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Textarea Field/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Select Field/)).toBeInTheDocument();
    });

    test('validates phone number format', async () => {
      const user = userEvent.setup();
      const fields = [
        { type: 'tel', label: 'Phone', name: 'phone', required: true }
      ];
      const onSubmit = jest.fn();
      
      render(<InlineAddModal {...defaultProps} fields={fields} onSubmit={onSubmit} />);
      
      const phoneInput = screen.getByLabelText(/Phone/);
      const submitButton = screen.getByText('Add');
      
      await user.type(phoneInput, 'invalid-phone');
      await user.click(submitButton);
      
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    test('validates number field with min/max constraints', async () => {
      const user = userEvent.setup();
      const fields = [
        { type: 'number', label: 'Age', name: 'age', min: 18, max: 65, required: true }
      ];
      const onSubmit = jest.fn();
      
      render(<InlineAddModal {...defaultProps} fields={fields} onSubmit={onSubmit} />);
      
      const ageInput = screen.getByLabelText(/Age/);
      const submitButton = screen.getByText('Add');
      
      await user.type(ageInput, '10');
      await user.click(submitButton);
      
      expect(screen.getByText('Value must be at least 18')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Custom Validation', () => {
    test('runs custom validation function', async () => {
      const user = userEvent.setup();
      const customValidate = jest.fn().mockReturnValue('Custom error message');
      const fields = [
        { 
          type: 'text', 
          label: 'Custom Field', 
          name: 'custom',
          validate: customValidate
        }
      ];
      const onSubmit = jest.fn();
      
      render(<InlineAddModal {...defaultProps} fields={fields} onSubmit={onSubmit} />);
      
      const customInput = screen.getByLabelText(/Custom Field/);
      const submitButton = screen.getByText('Add');
      
      await user.type(customInput, 'test value');
      await user.click(submitButton);
      
      expect(customValidate).toHaveBeenCalledWith('test value', { custom: 'test value' });
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('External State Management', () => {
    test('uses external form data and setFormData', async () => {
      const user = userEvent.setup();
      const formData = { name: 'Initial Name' };
      const setFormData = jest.fn();
      
      render(
        <InlineAddModal 
          {...defaultProps} 
          formData={formData}
          setFormData={setFormData}
        />
      );
      
      const nameInput = screen.getByLabelText(/Name/);
      expect(nameInput).toHaveValue('Initial Name');
      
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');
      
      // setFormData is called with a function, so we need to check if it was called
      expect(setFormData).toHaveBeenCalled();
      
      // Get the last call and execute the function to see the result
      const lastCall = setFormData.mock.calls[setFormData.mock.calls.length - 1][0];
      if (typeof lastCall === 'function') {
        const result = lastCall(formData);
        expect(result).toEqual(expect.objectContaining({
          name: 'New Name'
        }));
      }
    });

    test('uses external validation errors', () => {
      const validationErrors = { name: 'External error message' };
      
      render(
        <InlineAddModal 
          {...defaultProps} 
          validationErrors={validationErrors}
        />
      );
      
      expect(screen.getByText('External error message')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<InlineAddModal {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    test('focuses first input on open when autoFocus is true', async () => {
      render(<InlineAddModal {...defaultProps} autoFocus={true} />);
      
      await waitFor(() => {
        const firstInput = screen.getByLabelText(/Name/);
        expect(firstInput).toHaveFocus();
      });
    });

    test('does not auto focus when autoFocus is false', async () => {
      render(<InlineAddModal {...defaultProps} autoFocus={false} />);
      
      await waitFor(() => {
        const firstInput = screen.getByLabelText(/Name/);
        expect(firstInput).not.toHaveFocus();
      });
    });

    test('prevents body scroll when modal is open', () => {
      render(<InlineAddModal {...defaultProps} preventScroll={true} />);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    test('restores body scroll when modal is closed', () => {
      const { rerender } = render(<InlineAddModal {...defaultProps} preventScroll={true} />);
      
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<InlineAddModal {...defaultProps} isOpen={false} preventScroll={true} />);
      
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Callbacks', () => {
    test('calls onOpen when modal opens', () => {
      const onOpen = jest.fn();
      render(<InlineAddModal {...defaultProps} onOpen={onOpen} />);
      
      expect(onOpen).toHaveBeenCalled();
    });

    test('calls onAfterOpen after modal opens', async () => {
      const onAfterOpen = jest.fn();
      render(<InlineAddModal {...defaultProps} onAfterOpen={onAfterOpen} />);
      
      await waitFor(() => {
        expect(onAfterOpen).toHaveBeenCalled();
      });
    });

    test('calls onAfterClose when modal closes', () => {
      const onAfterClose = jest.fn();
      const { rerender } = render(<InlineAddModal {...defaultProps} onAfterClose={onAfterClose} />);
      
      rerender(<InlineAddModal {...defaultProps} isOpen={false} onAfterClose={onAfterClose} />);
      
      expect(onAfterClose).toHaveBeenCalled();
    });
  });
});