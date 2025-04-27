'use client';

import React from 'react';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'dots';
  text?: string;
  size?: 'small' | 'medium' | 'large';
  fullPage?: boolean;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  text = 'Loading...',
  size = 'medium',
  fullPage = false,
  className = '',
}) => {
  // Size mappings
  const sizeMap = {
    small: {
      spinner: 'h-4 w-4',
      container: 'py-2',
      text: 'text-xs',
    },
    medium: {
      spinner: 'h-8 w-8',
      container: 'py-4',
      text: 'text-sm',
    },
    large: {
      spinner: 'h-12 w-12',
      container: 'py-8',
      text: 'text-base',
    },
  };

  // Container classes
  const containerClasses = `
    flex flex-col items-center justify-center text-center
    ${sizeMap[size].container}
    ${fullPage ? 'fixed inset-0 bg-white bg-opacity-80 z-50' : ''}
    ${className}
  `;

  // Render spinner loading state
  if (type === 'spinner') {
    return (
      <div className={containerClasses}>
        <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeMap[size].spinner}`}></div>
        {text && <p className={`mt-2 text-gray-500 ${sizeMap[size].text}`}>{text}</p>}
      </div>
    );
  }

  // Render skeleton loading state
  if (type === 'skeleton') {
    return (
      <div className={containerClasses}>
        <div className="w-full max-w-md space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
        </div>
        {text && <p className={`mt-4 text-gray-500 ${sizeMap[size].text}`}>{text}</p>}
      </div>
    );
  }

  // Render dots loading state
  if (type === 'dots') {
    return (
      <div className={containerClasses}>
        <div className="flex space-x-2">
          <div className={`rounded-full bg-primary-600 ${size === 'small' ? 'h-2 w-2' : size === 'medium' ? 'h-3 w-3' : 'h-4 w-4'} animate-bounce`} style={{ animationDelay: '0ms' }}></div>
          <div className={`rounded-full bg-primary-600 ${size === 'small' ? 'h-2 w-2' : size === 'medium' ? 'h-3 w-3' : 'h-4 w-4'} animate-bounce`} style={{ animationDelay: '150ms' }}></div>
          <div className={`rounded-full bg-primary-600 ${size === 'small' ? 'h-2 w-2' : size === 'medium' ? 'h-3 w-3' : 'h-4 w-4'} animate-bounce`} style={{ animationDelay: '300ms' }}></div>
        </div>
        {text && <p className={`mt-4 text-gray-500 ${sizeMap[size].text}`}>{text}</p>}
      </div>
    );
  }

  // Default fallback
  return (
    <div className={containerClasses}>
      <p className={`text-gray-500 ${sizeMap[size].text}`}>{text}</p>
    </div>
  );
};

export default LoadingState;