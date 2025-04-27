'use client';

import React from 'react';
import Link from 'next/link';
import { FiInfo } from 'react-icons/fi';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  actionLink?: string;
  actionCallback?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No items found',
  message = 'There are no items to display at this time.',
  actionText,
  actionLink,
  actionCallback,
  icon = <FiInfo className="h-12 w-12 text-gray-400" />,
  className = '',
}) => {
  return (
    <div className={`text-center py-8 px-4 ${className}`}>
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto">{message}</p>
      
      {(actionText && actionLink) && (
        <div className="mt-6">
          <Link 
            href={actionLink}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {actionText}
          </Link>
        </div>
      )}
      
      {(actionText && actionCallback) && (
        <div className="mt-6">
          <button
            onClick={actionCallback}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;