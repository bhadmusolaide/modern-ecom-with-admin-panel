import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled' | 'flushed';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className = '',
    error,
    label,
    helperText,
    leftIcon,
    rightIcon,
    fullWidth = true,
    size = 'md',
    variant = 'outline',
    id,
    ...props
  }, ref) => {
    // Generate a unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    // Size classes
    const sizeClasses = {
      sm: 'py-1 px-2 text-xs',
      md: 'py-2 px-3 text-sm',
      lg: 'py-2.5 px-4 text-base'
    };

    // Variant classes
    const variantClasses = {
      outline: 'border-gray-300 bg-transparent focus:border-primary-500',
      filled: 'border-gray-200 bg-gray-100 focus:bg-white focus:border-primary-500',
      flushed: 'border-0 border-b border-gray-300 rounded-none px-0 focus:border-primary-500'
    };

    // Width class
    const widthClass = fullWidth ? 'w-full' : 'w-auto';

    // Icon padding classes
    const leftIconPadding = leftIcon ? 'pl-10' : '';
    const rightIconPadding = rightIcon ? 'pr-10' : '';

    return (
      <div className={`${fullWidth ? 'w-full' : 'inline-block'}`}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`
              block ${widthClass} rounded-md shadow-sm
              focus:ring-primary-500 focus:ring-opacity-50 focus:outline-none focus:ring-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${sizeClasses[size]} ${variantClasses[variant]} ${leftIconPadding} ${rightIconPadding}
              ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600" role="alert">{error}</p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;