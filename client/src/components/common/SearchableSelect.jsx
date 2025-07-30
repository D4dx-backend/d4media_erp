import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  onAdd,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  multiple = false,
  disabled = false,
  loading = false,
  error = '',
  addButtonText = 'Add New',
  maxHeight = 250,
  virtualScrolling = true,
  debounceMs = 300,
  className = '',
  size = 'md',
  allowClear = true,
  showSearch = true,
  autoFocus = false,
  id,
  name,
  required = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSelections, setRecentSelections] = useState([]);
  
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const debounceTimeout = useRef(null);
  const optionRefs = useRef({});

  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'px-2 py-1 text-sm',
      input: 'px-2 py-1 text-sm',
      option: 'px-2 py-1 text-sm',
      height: 32
    },
    md: {
      button: 'px-3 py-2',
      input: 'px-3 py-2',
      option: 'px-3 py-2',
      height: 40
    },
    lg: {
      button: 'px-4 py-3 text-lg',
      input: 'px-4 py-3 text-lg',
      option: 'px-4 py-3 text-lg',
      height: 48
    }
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  // Fuzzy search algorithm
  const fuzzyMatch = useCallback((text, searchTerm) => {
    if (!searchTerm) return { matches: true, score: 1 };
    
    const textLower = text.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    // Exact match gets highest score
    if (textLower.includes(searchLower)) {
      return { matches: true, score: 0.9 };
    }
    
    // Fuzzy matching for typos
    let searchIndex = 0;
    let score = 0;
    
    for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIndex]) {
        searchIndex++;
        score += 1;
      }
    }
    
    const matchRatio = searchIndex / searchLower.length;
    const matches = matchRatio >= 0.6; // 60% character match threshold
    
    return { matches, score: matches ? matchRatio * 0.7 : 0 };
  }, []);

  // Highlight matching text
  const highlightText = useCallback((text, searchTerm) => {
    if (!searchTerm) return text;
    
    try {
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedTerm})`, 'gi');
      const parts = text.split(regex);
      
      return parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 text-gray-900 font-medium">
            {part}
          </mark>
        ) : part
      );
    } catch (error) {
      // Fallback if regex fails
      return text;
    }
  }, []);

  // Filter and sort options
  const processedOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      // Show recent selections first when no search
      const recentOptions = options.filter(opt => 
        recentSelections.includes(opt.value)
      );
      const otherOptions = options.filter(opt => 
        !recentSelections.includes(opt.value)
      );
      return [...recentOptions, ...otherOptions];
    }

    const filtered = options
      .map(option => ({
        ...option,
        ...fuzzyMatch(option.label, searchTerm)
      }))
      .filter(option => option.matches)
      .sort((a, b) => b.score - a.score);

    return filtered;
  }, [options, searchTerm, fuzzyMatch, recentSelections]);

  // Update filtered options
  useEffect(() => {
    setFilteredOptions(processedOptions);
    setHighlightedIndex(-1);
  }, [processedOptions]);

  // Debounced search
  const handleSearchChange = useCallback((e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Immediate update for better UX, but still debounce for performance
    debounceTimeout.current = setTimeout(() => {
      // Additional processing if needed
    }, debounceMs);
  }, [debounceMs]);

  // Get selected option(s)
  const getSelectedOption = useCallback(() => {
    if (multiple) {
      return options.filter(option => 
        Array.isArray(value) ? value.includes(option.value) : false
      );
    }
    return options.find(option => option.value === value) || null;
  }, [options, value, multiple]);

  // Handle option selection
  const handleOptionSelect = useCallback((option) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValue = currentValues.includes(option.value)
        ? currentValues.filter(v => v !== option.value)
        : [...currentValues, option.value];
      onChange(newValue);
    } else {
      onChange(option.value);
      setIsOpen(false);
      
      // Update recent selections
      setRecentSelections(prev => {
        const updated = [option.value, ...prev.filter(v => v !== option.value)];
        return updated.slice(0, 5); // Keep only 5 recent selections
      });
    }
    
    setSearchTerm('');
    setHighlightedIndex(-1);
  }, [multiple, value, onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        } else if (filteredOptions.length === 0 && searchTerm.trim() && onAdd) {
          handleAddNew();
        }
        break;
        
      case 'Tab':
        setIsOpen(false);
        break;
        
      default:
        break;
    }
  }, [isOpen, highlightedIndex, filteredOptions, handleOptionSelect, searchTerm, onAdd]);

  // Handle add new option
  const handleAddNew = useCallback(() => {
    if (onAdd && searchTerm.trim()) {
      onAdd(searchTerm.trim());
      setSearchTerm('');
      setIsOpen(false);
    }
  }, [onAdd, searchTerm]);

  // Clear selection
  const handleClear = useCallback((e) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
  }, [onChange, multiple]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, showSearch]);

  // Auto focus on mount
  useEffect(() => {
    if (autoFocus && dropdownRef.current) {
      dropdownRef.current.querySelector('[role="combobox"]').focus();
    }
  }, [autoFocus]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      if (virtualScrolling) {
        listRef.current.scrollToItem(highlightedIndex, 'smart');
      } else {
        const optionElement = optionRefs.current[highlightedIndex];
        if (optionElement) {
          optionElement.scrollIntoView({ block: 'nearest' });
        }
      }
    }
  }, [highlightedIndex, virtualScrolling]);

  const selectedOption = getSelectedOption();
  const showAddOption = searchTerm.trim() !== '' && 
    filteredOptions.length === 0 && 
    onAdd !== undefined;

  // Virtual list item renderer
  const OptionItem = ({ index, style }) => {
    const option = filteredOptions[index];
    const isSelected = multiple 
      ? Array.isArray(value) && value.includes(option.value)
      : option.value === value;
    const isHighlighted = index === highlightedIndex;

    return (
      <div
        style={style}
        ref={el => optionRefs.current[index] = el}
        className={`cursor-pointer flex items-center ${currentSize.option} ${
          isHighlighted ? 'bg-blue-100' : 'hover:bg-gray-100'
        } ${isSelected ? 'bg-blue-50 font-medium' : ''}`}
        onClick={() => handleOptionSelect(option)}
        role="option"
        aria-selected={isSelected}
        id={`${id || name}-option-${index}`}
      >
        {multiple && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            tabIndex={-1}
          />
        )}
        <span className="flex-1">
          {highlightText(option.label, searchTerm)}
        </span>
        {option.description && (
          <span className="text-sm text-gray-500 ml-2">
            {option.description}
          </span>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`relative ${className}`} 
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-required={required}
        id={id}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full text-left bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${currentSize.button} ${
          disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'hover:border-gray-400 cursor-pointer'
        } ${error ? 'border-red-500' : 'border-gray-300'}`}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {multiple ? (
              <div className="flex flex-wrap gap-1">
                {selectedOption && selectedOption.length > 0 ? (
                  selectedOption.map(option => (
                    <span 
                      key={option.value} 
                      className="inline-flex items-center px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-md"
                    >
                      {option.label}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          const newValue = value.filter(v => v !== option.value);
                          onChange(newValue);
                        }}
                        className="ml-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                        aria-label={`Remove ${option.label}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            const newValue = value.filter(v => v !== option.value);
                            onChange(newValue);
                          }
                        }}
                      >
                        ×
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 truncate">{placeholder}</span>
                )}
              </div>
            ) : (
              selectedOption ? (
                <span className="truncate">{selectedOption.label}</span>
              ) : (
                <span className="text-gray-500 truncate">{placeholder}</span>
              )
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {allowClear && (selectedOption || (multiple && Array.isArray(value) && value.length > 0)) && (
              <span
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                aria-label="Clear selection"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClear(e);
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            )}
            
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              viewBox="0 0 20 20" 
              fill="none" 
              stroke="currentColor"
            >
              <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {showSearch && (
            <div className="p-2 border-b border-gray-200">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className={`w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${currentSize.input}`}
                autoComplete="off"
                role="searchbox"
                aria-label="Search options"
              />
            </div>
          )}
          
          <div 
            className="overflow-auto"
            style={{ maxHeight: `${maxHeight}px` }}
            role="listbox"
            aria-label="Options"
          >
            {loading ? (
              <div className="p-4 text-center text-gray-500 flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </div>
            ) : filteredOptions.length > 0 ? (
              virtualScrolling && filteredOptions.length > 10 ? (
                <List
                  ref={listRef}
                  height={Math.min(filteredOptions.length * currentSize.height, maxHeight - (showSearch ? 50 : 0))}
                  itemCount={filteredOptions.length}
                  itemSize={currentSize.height}
                  itemData={filteredOptions}
                >
                  {OptionItem}
                </List>
              ) : (
                filteredOptions.map((option, index) => (
                  <OptionItem key={option.value} index={index} style={{}} />
                ))
              )
            ) : (
              <div className="p-4 text-center text-gray-500">
                No results found
                {searchTerm && (
                  <div className="text-sm mt-1">
                    Try adjusting your search or check for typos
                  </div>
                )}
              </div>
            )}
          </div>
          
          {showAddOption && (
            <div className="p-2 border-t border-gray-200">
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-dashed border-blue-300 hover:border-blue-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {addButtonText} "{searchTerm}"
              </button>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default SearchableSelect;