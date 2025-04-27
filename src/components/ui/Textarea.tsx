import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled' | 'flushed';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  autoGrow?: boolean;
  maxHeight?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className = '',
    error,
    label,
    helperText,
    fullWidth = true,
    size = 'md',
    variant = 'outline',
    resize = 'vertical',
    autoGrow = false,
    maxHeight,
    id,
    ...props
  }, ref) => {
    // Generate a unique ID if not provided
    const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;

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

    // Resize classes
    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    };

    // Width class
    const widthClass = fullWidth ? 'w-full' : 'w-auto';

    // Auto-grow functionality
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (autoGrow) {
        const target = e.currentTarget;
        target.style.height = 'auto';
        const newHeight = Math.min(target.scrollHeight, maxHeight || Infinity);
        target.style.height = `${newHeight}px`;
      }
    };

    // Set initial height for auto-grow
    React.useEffect(() => {
      if (autoGrow && ref && 'current' in ref && ref.current) {
        const textarea = ref.current;
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, maxHeight || Infinity);
        textarea.style.height = `${newHeight}px`;
      }
    }, [autoGrow, maxHeight, ref]);

    return (
      <div className={`${fullWidth ? 'w-full' : 'inline-block'}`}>
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            id={textareaId}
            ref={ref}
            className={`
              block ${widthClass} rounded-md shadow-sm
              focus:ring-primary-500 focus:ring-opacity-50 focus:outline-none focus:ring-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${sizeClasses[size]} ${variantClasses[variant]} ${resizeClasses[resize]}
              ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
            onInput={autoGrow ? handleInput : undefined}
            style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
            {...props}
          />
        </div>

        {error && (
          <p id={`${textareaId}-error`} className="mt-1 text-sm text-red-600" role="alert">{error}</p>
        )}

        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;