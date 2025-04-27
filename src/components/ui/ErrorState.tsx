'use client';

import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

interface ErrorStateProps {
  message?: string;
  retryAction?: () => void;
  className?: string;
  variant?: 'inline' | 'card' | 'full';
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong. Please try again later.',
  retryAction,
  className = '',
  variant = 'card',
}) => {
  // Variant styles
  const variantStyles = {
    inline: 'py-2 px-3 bg-red-50 border border-red-100 rounded-md',
    card: 'p-6 bg-red-50 border border-red-100 rounded-lg shadow-sm',
    full: 'p-8 bg-red-50 border border-red-100 rounded-lg shadow-sm max-w-lg mx-auto',
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FiAlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          {retryAction && (
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={retryAction}
              >
                <FiRefreshCw className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;