'use client';

import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Container component with standardized widths and responsive behavior
 *
 * @param size - Container width: sm (640px), md (768px), lg (1024px), xl (1280px), full (100%)
 * @param padding - Container padding: none (0), sm (1rem), md (1.5rem), lg (2rem)
 */
export default function Container({
  children,
  className = '',
  size = 'lg',
  padding = 'md'
}: ContainerProps) {
  // Define width classes based on size prop
  const sizeClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    full: 'max-w-full'
  };

  // Define padding classes based on padding prop
  const paddingClasses = {
    none: 'px-0',
    sm: 'px-4',
    md: 'px-4', // Changed from px-6 to px-4 for consistency
    lg: 'px-8'
  };

  return (
    <div className={`mx-auto w-full ${sizeClasses[size]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}