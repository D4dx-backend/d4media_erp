import React from 'react';
import TouchButton from './TouchButton';

const AddNewModal = ({
  isOpen,
  onClose,
  title,
  icon,
  iconColor = "blue",
  children,
  onSubmit,
  submitLabel = "Add",
  submitDisabled = false,
  isSubmitting = false,
  maxWidth = "md"
}) => {
  if (!isOpen) return null;

  const getIconColorClasses = () => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      orange: "bg-orange-100 text-orange-600",
      red: "bg-red-100 text-red-600"
    };
    return colors[iconColor] || colors.blue;
  };

  const getMaxWidthClass = () => {
    const widths = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl"
    };
    return widths[maxWidth] || widths.md;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg p-6 w-full ${getMaxWidthClass()} shadow-xl transform transition-all`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
            {icon && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getIconColorClasses()}`}>
                {icon}
              </div>
            )}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4 mb-6">
          {children}
        </div>
        
        <div className="flex justify-end space-x-3">
          <TouchButton
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </TouchButton>
          <TouchButton
            type="button"
            variant="primary"
            size="md"
            onClick={onSubmit}
            disabled={submitDisabled || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : submitLabel}
          </TouchButton>
        </div>
      </div>
    </div>
  );
};

export default AddNewModal;