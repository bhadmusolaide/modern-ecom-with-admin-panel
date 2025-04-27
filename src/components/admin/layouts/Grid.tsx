'use client';

import React from 'react';

interface GridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  mdCols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  lgCols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  xlCols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
}

/**
 * Grid component with responsive column configuration
 * 
 * @param cols - Number of columns on mobile (default: 1)
 * @param mdCols - Number of columns on medium screens (default: same as cols)
 * @param lgCols - Number of columns on large screens (default: same as mdCols)
 * @param xlCols - Number of columns on extra large screens (default: same as lgCols)
 * @param gap - Gap between grid items: none (0), sm (0.5rem), md (1rem), lg (1.5rem)
 */
export default function Grid({ 
  children, 
  className = '', 
  cols = 1,
  gap = 'md',
  mdCols,
  lgCols,
  xlCols
}: GridProps) {
  // Define column classes based on props
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12'
  };

  // Define gap classes based on gap prop
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  // Set responsive column classes
  const mdColsClass = mdCols ? `md:${colClasses[mdCols]}` : '';
  const lgColsClass = lgCols ? `lg:${colClasses[lgCols]}` : '';
  const xlColsClass = xlCols ? `xl:${colClasses[xlCols]}` : '';

  return (
    <div className={`grid ${colClasses[cols]} ${mdColsClass} ${lgColsClass} ${xlColsClass} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}