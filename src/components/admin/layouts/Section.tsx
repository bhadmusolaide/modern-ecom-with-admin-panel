'use client';

import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  titleSize?: 'sm' | 'md' | 'lg' | 'xl';
  spacing?: 'sm' | 'md' | 'lg';
  divider?: boolean;
  actions?: React.ReactNode;
}

/**
 * Section component for grouping content with optional title and description
 * 
 * @param title - Section title
 * @param description - Section description
 * @param titleSize - Title size: sm, md, lg, xl
 * @param spacing - Spacing between title and content: sm (0.75rem), md (1.25rem), lg (2rem)
 * @param divider - Whether to show a divider between title and content
 * @param actions - Optional actions to display in the header
 */
export default function Section({ 
  children, 
  className = '', 
  title,
  description,
  titleSize = 'lg',
  spacing = 'md',
  divider = false,
  actions
}: SectionProps) {
  // Define title size classes
  const titleClasses = {
    sm: 'text-lg font-medium',
    md: 'text-xl font-medium',
    lg: 'text-2xl font-semibold',
    xl: 'text-3xl font-bold'
  };

  // Define spacing classes
  const spacingClasses = {
    sm: 'mb-3',
    md: 'mb-5',
    lg: 'mb-8'
  };

  // Only render header if title, description, or actions exist
  const hasHeader = title || description || actions;

  return (
    <section className={`${className}`}>
      {hasHeader && (
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between ${spacingClasses[spacing]}`}>
          <div>
            {title && <h2 className={titleClasses[titleSize]}>{title}</h2>}
            {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
          </div>
          {actions && (
            <div className="mt-4 md:mt-0 flex space-x-3">
              {actions}
            </div>
          )}
        </div>
      )}
      
      {divider && hasHeader && <div className="h-px bg-neutral-200 mb-6"></div>}
      
      <div>
        {children}
      </div>
    </section>
  );
}