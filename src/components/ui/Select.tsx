import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled' | 'flushed';
  leftIcon?: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className = '',
    error,
    label,
    helperText,
    fullWidth = true,
    size = 'md',
    variant = 'outline',
    leftIcon,
    id,
    children,
    ...props
  }, ref) => {
    // Generate a unique ID if not provided
    const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;

    // Size classes
    const sizeClasses = {
      sm: 'py-1 pl-2 pr-8 text-xs',
      md: 'py-2 pl-3 pr-10 text-sm',
      lg: 'py-2.5 pl-4 pr-10 text-base'
    };

    // Variant classes
    const variantClasses = {
      outline: 'border-gray-300 bg-transparent focus:border-primary-500',
      filled: 'border-gray-200 bg-gray-100 focus:bg-white focus:border-primary-500',
      flushed: 'border-0 border-b border-gray-300 rounded-none px-0 focus:border-primary-500'
    };

    // Width class
    const widthClass = fullWidth ? 'w-full' : 'w-auto';

    // Icon padding
    const leftIconPadding = leftIcon ? 'pl-10' : '';

    return (
      <div className={`${fullWidth ? 'w-full' : 'inline-block'}`}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
              {leftIcon}
            </div>
          )}

          <select
            id={selectId}
            ref={ref}
            className={`
              block ${widthClass} rounded-md shadow-sm appearance-none
              focus:ring-primary-500 focus:ring-opacity-50 focus:outline-none focus:ring-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${sizeClasses[size]} ${variantClasses[variant]} ${leftIconPadding}
              ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            {...props}
          >
            {children}
          </select>

          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500">
            <ChevronDown size={size === 'sm' ? 16 : 20} />
          </div>
        </div>

        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-sm text-red-600" role="alert">{error}</p>
        )}

        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;