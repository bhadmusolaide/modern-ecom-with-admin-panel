"use client";

import React from 'react';
import { motion } from 'framer-motion';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  fullWidth?: boolean;
  rounded?: boolean;
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;
  ariaLabel?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  type = 'button',
  onClick,
  fullWidth = false,
  rounded = false,
  href,
  target,
  rel,
  ariaLabel,
  ...props
}, ref) => {
  const baseClasses = 'btn inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-500',
    accent: 'bg-accent-600 text-white hover:bg-accent-700 focus-visible:ring-accent-500',
    outline: 'border border-neutral-300 bg-transparent hover:bg-neutral-100 text-neutral-700 focus-visible:ring-primary-500',
    ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 focus-visible:ring-primary-500',
  };

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded',
    md: 'text-sm px-5 py-2.5 rounded-md',
    lg: 'text-base px-6 py-3 rounded-md',
  };

  const fullWidthClass = fullWidth ? 'w-full' : '';
  const roundedClass = rounded ? 'rounded-full' : '';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidthClass} ${roundedClass} ${className}`;

  // If href is provided, render an anchor tag styled as a button
  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={classes}
        aria-label={ariaLabel}
        onClick={(e) => onClick && onClick(e as any)}
      >
        {isLoading ? (
          <>
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="mr-2" aria-hidden="true">{icon}</span>}
            <span>{children}</span>
            {icon && iconPosition === 'right' && <span className="ml-2" aria-hidden="true">{icon}</span>}
          </>
        )}
      </a>
    );
  }

  // Otherwise render a button
  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
      className={classes}
      disabled={isLoading || disabled}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="mr-2" aria-hidden="true">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="ml-2" aria-hidden="true">{icon}</span>}
        </>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
