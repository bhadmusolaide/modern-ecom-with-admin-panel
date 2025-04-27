"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  variant?: 'default' | 'elevated' | 'outlined' | 'colored';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  interactive?: boolean;
  fullWidth?: boolean;
  title?: string;
  subtitle?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = true,
  variant = 'default',
  padding = 'md',
  onClick,
  interactive = false,
  fullWidth = true,
  title,
  subtitle
}) => {
  // Variant classes
  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white border border-gray-100 shadow-md',
    outlined: 'bg-white border border-gray-300',
    colored: 'bg-primary-50 border border-primary-100',
  };

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  // Interactive classes
  const interactiveClasses = interactive
    ? 'cursor-pointer transition-all duration-200 hover:shadow-md active:shadow-sm'
    : '';

  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';

  // Combine all classes
  const cardClasses = `
    rounded-lg ${variantClasses[variant]} ${interactiveClasses} ${widthClasses} ${className}
  `;

  // Title and subtitle rendering
  const renderTitleContent = () => {
    if (!title && !subtitle) return null;

    return (
      <div className={`${paddingClasses[padding]} border-b border-gray-200`}>
        {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
    );
  };

  return (
    <motion.div
      className={cardClasses}
      whileHover={hoverEffect && !interactive ? { y: -5 } : interactive ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {renderTitleContent()}
      {children}
    </motion.div>
  );
};

export default Card;

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  title?: string;
  subtitle?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  padding = 'md',
  title,
  subtitle
}) => {
  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={`${paddingClasses[padding]} border-b border-gray-200 ${className}`}>
      {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      {children}
    </div>
  );
};

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
  padding = 'md'
}) => {
  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={`${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right' | 'between' | 'around';
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  padding = 'md',
  align = 'left'
}) => {
  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  // Alignment classes
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  return (
    <div className={`${paddingClasses[padding]} border-t border-gray-200 flex items-center ${alignmentClasses[align]} ${className}`}>
      {children}
    </div>
  );
};
