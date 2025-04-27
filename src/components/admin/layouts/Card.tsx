'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  hover?: boolean;
  as?: 'div' | 'article' | 'section';
}

/**
 * Card component with standardized styling and animation options
 * 
 * @param padding - Card padding: none (0), sm (0.75rem), md (1.25rem), lg (1.75rem)
 * @param shadow - Card shadow: none, sm, md, lg
 * @param border - Whether to show a border
 * @param rounded - Border radius: none (0), sm (0.25rem), md (0.375rem), lg (0.5rem), full (9999px)
 * @param hover - Whether to add hover animation
 * @param as - HTML element to render as
 */
export default function Card({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'md',
  border = true,
  rounded = 'md',
  hover = false,
  as = 'div',
  ...motionProps
}: CardProps) {
  // Define padding classes based on padding prop
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7'
  };

  // Define shadow classes based on shadow prop
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg'
  };

  // Define rounded classes based on rounded prop
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  // Combine all classes
  const cardClasses = `
    bg-white 
    ${paddingClasses[padding]} 
    ${shadowClasses[shadow]} 
    ${roundedClasses[rounded]} 
    ${border ? 'border border-neutral-200' : ''} 
    ${hover ? 'transition-all duration-200' : ''}
    ${className}
  `;

  // Define hover animation if enabled
  const hoverAnimation = hover ? {
    whileHover: { y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
    transition: { duration: 0.2 }
  } : {};

  // Combine motion props with hover animation
  const combinedMotionProps = {
    ...motionProps,
    ...hoverAnimation
  };

  return (
    <motion.div 
      className={cardClasses}
      {...combinedMotionProps}
    >
      {children}
    </motion.div>
  );
}