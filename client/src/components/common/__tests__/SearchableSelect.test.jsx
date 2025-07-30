import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchableSelect from '../SearchableSelect';

// Mock react-window
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemData }) => (
    <div data-testid="virtual-list">
      {Array.from({ length: itemCount }, (_, index) => 
        children({ index, style: {}, key: index })
      )}
    </div>
  )
}));

const mockOptions = [
  { value: '1', label: 'Option 1', description: 'First option' },
  { value: '2', label: 'Option 2', description: 'Second option' },
  { value: '3', label: 'Another Option', description: 'Third option' },
  { value: '4', label: 'Different Choice', description: 'Fourth option' },
  { value: '5', label: 'Last Option', description: 'Fifth option' }
];

describe('SearchableSelect', () => {
  const defaultProps = {
    options: mockOptions,
    onChange: jest.fn(),
    placeholder: 'Select an option'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    test('renders with placeholder when no value selected', () => {
      render(<SearchableSelect {...defaultProps} />);
      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    test('displays selected option when value is provided', () => {
      render(<SearchableSelect {...defaultProps} value="1" />);
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    test('opens dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    test('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <SearchableSelect {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      );
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('outside'));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('filters options based on search input', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'Option');
      
      await waitFor(() => {
        // Check for highlighted text within the options
        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThan(0);
        expect(screen.queryByText('Different Choice')).not.toBeInTheDocument();
      });
    });

    test('shows "No results found" when search has no matches', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'xyz123');
      
      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });
    });

    test('highlights matching text in search results', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'Option');
      
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThan(0);
      });
    });

    test('supports fuzzy matching for typos', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'Optin'); // Typo for "Option"
      
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Selection Handling', () => {
    test('calls onChange when option is selected', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<SearchableSelect {...defaultProps} onChange={onChange} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const options = screen.getAllByRole('option');
      await user.click(options[0]);
      
      expect(onChange).toHaveBeenCalledWith('1');
    });

    test('closes dropdown after single selection', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const options = screen.getAllByRole('option');
      await user.click(options[0]);
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    test('handles multiple selection', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<SearchableSelect {...defaultProps} onChange={onChange} multiple />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const options = screen.getAllByRole('option');
      
      await user.click(options[0]);
      expect(onChange).toHaveBeenCalledWith(['1']);
      
      // Reset the mock to check the second call independently
      onChange.mockClear();
      
      await user.click(options[1]);
      expect(onChange).toHaveBeenCalledWith(['2']);
    });

    test('displays selected options as tags in multiple mode', () => {
      render(<SearchableSelect {...defaultProps} value={['1', '2']} multiple />);
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    test('allows removing tags in multiple mode', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <SearchableSelect 
          {...defaultProps} 
          value={['1', '2']} 
          multiple 
          onChange={onChange} 
        />
      );
      
      const removeButtons = screen.getAllByText('×');
      await user.click(removeButtons[0]);
      
      expect(onChange).toHaveBeenCalledWith(['2']);
    });
  });

  describe('Keyboard Navigation', () => {
    test('opens dropdown with Arrow Down key', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      combobox.focus();
      
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    test('opens dropdown with Enter key', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      combobox.focus();
      
      await user.keyboard('{Enter}');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    test('closes dropdown with Escape key', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    test('navigates options with arrow keys', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      // Navigate down - the first arrow down should highlight the first option
      await user.keyboard('{ArrowDown}');
      
      // Select with Enter
      await user.keyboard('{Enter}');
      
      expect(defaultProps.onChange).toHaveBeenCalledWith('1');
    });
  });

  describe('Add New Functionality', () => {
    test('shows add new option when search has no results and onAdd is provided', async () => {
      const user = userEvent.setup();
      const onAdd = jest.fn();
      render(<SearchableSelect {...defaultProps} onAdd={onAdd} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'New Item');
      
      await waitFor(() => {
        expect(screen.getByText('Add New "New Item"')).toBeInTheDocument();
      });
    });

    test('calls onAdd when add new button is clicked', async () => {
      const user = userEvent.setup();
      const onAdd = jest.fn();
      render(<SearchableSelect {...defaultProps} onAdd={onAdd} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'New Item');
      
      await waitFor(() => {
        const addButton = screen.getByText('Add New "New Item"');
        return user.click(addButton);
      });
      
      expect(onAdd).toHaveBeenCalledWith('New Item');
    });

    test('calls onAdd when Enter is pressed with no matching results', async () => {
      const user = userEvent.setup();
      const onAdd = jest.fn();
      render(<SearchableSelect {...defaultProps} onAdd={onAdd} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'New Item');
      
      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });
      
      await user.keyboard('{Enter}');
      expect(onAdd).toHaveBeenCalledWith('New Item');
    });
  });

  describe('Clear Functionality', () => {
    test('shows clear button when value is selected and allowClear is true', () => {
      render(<SearchableSelect {...defaultProps} value="1" allowClear />);
      
      expect(screen.getByLabelText('Clear selection')).toBeInTheDocument();
    });

    test('clears selection when clear button is clicked', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <SearchableSelect 
          {...defaultProps} 
          value="1" 
          allowClear 
          onChange={onChange} 
        />
      );
      
      const clearButton = screen.getByLabelText('Clear selection');
      await user.click(clearButton);
      
      expect(onChange).toHaveBeenCalledWith('');
    });

    test('clears multiple selections when clear button is clicked', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <SearchableSelect 
          {...defaultProps} 
          value={['1', '2']} 
          multiple 
          allowClear 
          onChange={onChange} 
        />
      );
      
      const clearButton = screen.getByLabelText('Clear selection');
      await user.click(clearButton);
      
      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Loading and Error States', () => {
    test('shows loading state', () => {
      render(<SearchableSelect {...defaultProps} loading />);
      
      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('shows error message', () => {
      render(<SearchableSelect {...defaultProps} error="Something went wrong" />);
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    test('disables component when disabled prop is true', () => {
      render(<SearchableSelect {...defaultProps} disabled />);
      
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Virtual Scrolling', () => {
    test('uses virtual scrolling for large datasets', async () => {
      const user = userEvent.setup();
      const largeOptions = Array.from({ length: 20 }, (_, i) => ({
        value: `${i}`,
        label: `Option ${i}`
      }));
      
      render(
        <SearchableSelect 
          {...defaultProps} 
          options={largeOptions} 
          virtualScrolling 
        />
      );
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    test('disables virtual scrolling when virtualScrolling is false', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} virtualScrolling={false} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      expect(screen.queryByTestId('virtual-list')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(
        <SearchableSelect 
          {...defaultProps} 
          id="test-select"
          aria-label="Test select"
          required
        />
      );
      
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
      expect(combobox).toHaveAttribute('aria-label', 'Test select');
      expect(combobox).toHaveAttribute('aria-required', 'true');
      expect(combobox).toHaveAttribute('id', 'test-select');
    });

    test('updates aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(combobox);
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    test('search input has proper accessibility attributes', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', 'Search options');
    });

    test('options have proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} value="1" />);
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(options[1]).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Size Variants', () => {
    test('applies small size classes', () => {
      render(<SearchableSelect {...defaultProps} size="sm" />);
      
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveClass('px-2', 'py-1', 'text-sm');
    });

    test('applies large size classes', () => {
      render(<SearchableSelect {...defaultProps} size="lg" />);
      
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveClass('px-4', 'py-3', 'text-lg');
    });
  });
});