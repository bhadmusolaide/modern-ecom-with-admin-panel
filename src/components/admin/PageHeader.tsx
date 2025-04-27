'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight } from 'lucide-react';

interface ActionButton {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
}

interface Breadcrumb {
  label: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ActionButton[];
  showBreadcrumbs?: boolean;
  breadcrumbs?: Breadcrumb[];
  backUrl?: string;
  backLabel?: string;
}

export default function PageHeader({
  title,
  description,
  actions = [],
  showBreadcrumbs = true,
  breadcrumbs,
  backUrl,
  backLabel,
}: PageHeaderProps) {
  const pathname = usePathname() || '';

  // Generate breadcrumbs based on current path or use provided breadcrumbs
  const generateBreadcrumbs = () => {
    if (!showBreadcrumbs) return null;
    
    if (breadcrumbs) {
      return (
        <div className="flex items-center text-sm text-neutral-500 mb-4">
          <a href="/admin" className="flex items-center hover:text-primary-600 transition-colors">
            <Home size={14} className="mr-1" />
            <span>Admin</span>
          </a>
          
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center">
              <ChevronRight size={14} className="mx-2" />
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-neutral-700">{crumb.label}</span>
              ) : (
                <a href={crumb.href} className="hover:text-primary-600 transition-colors">
                  {crumb.label}
                </a>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (!pathname || pathname === '/admin') return null;
    
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // Skip the first segment which is 'admin'
    const generatedBreadcrumbs = pathSegments.slice(1).map((segment, index) => {
      // Create the URL for this breadcrumb
      const url = `/${pathSegments.slice(0, index + 2).join('/')}`;
      
      // Format the segment name (capitalize first letter, replace hyphens with spaces)
      const name = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
      
      return { name, url };
    });
    
    return (
      <div className="flex items-center text-sm text-neutral-500 mb-4">
        <a href="/admin" className="flex items-center hover:text-primary-600 transition-colors">
          <Home size={14} className="mr-1" />
          <span>Admin</span>
        </a>
        
        {generatedBreadcrumbs.map((crumb, index) => (
          <div key={crumb.url} className="flex items-center">
            <ChevronRight size={14} className="mx-2" />
            {index === generatedBreadcrumbs.length - 1 ? (
              <span className="font-medium text-neutral-700">{crumb.name}</span>
            ) : (
              <a href={crumb.url} className="hover:text-primary-600 transition-colors">
                {crumb.name}
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render button based on variant
  const renderButton = (button: ActionButton, index: number) => {
    const baseClasses = "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors";
    
    let variantClasses = "";
    switch (button.variant) {
      case 'primary':
        variantClasses = "bg-primary-600 text-white hover:bg-primary-700";
        break;
      case 'secondary':
        variantClasses = "bg-accent-500 text-white hover:bg-accent-600";
        break;
      case 'outline':
        variantClasses = "border border-neutral-300 text-neutral-700 hover:bg-neutral-50";
        break;
      case 'danger':
        variantClasses = "bg-red-600 text-white hover:bg-red-700";
        break;
      default:
        variantClasses = "bg-primary-600 text-white hover:bg-primary-700";
    }
    
    const disabledClasses = button.disabled ? "opacity-50 cursor-not-allowed" : "";
    const buttonClasses = `${baseClasses} ${variantClasses} ${disabledClasses}`;
    
    if (button.href) {
      return (
        <a 
          key={index}
          href={button.disabled ? undefined : button.href}
          className={buttonClasses}
          onClick={button.disabled ? (e) => e.preventDefault() : undefined}
        >
          {button.icon && <span className="mr-2">{button.icon}</span>}
          {button.label}
        </a>
      );
    }
    
    return (
      <button
        key={index}
        onClick={button.onClick}
        disabled={button.disabled}
        className={buttonClasses}
      >
        {button.icon && <span className="mr-2">{button.icon}</span>}
        {button.label}
      </button>
    );
  };

  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {generateBreadcrumbs()}
      
      {/* Back link */}
      {backUrl && (
        <a 
          href={backUrl}
          className="flex items-center text-sm text-neutral-600 hover:text-primary-600 transition-colors mb-4"
        >
          <ChevronRight size={16} className="mr-1 transform rotate-180" />
          <span>{backLabel || 'Back'}</span>
        </a>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          )}
        </div>
        
        {actions.length > 0 && (
          <div className="flex space-x-3 mt-4 md:mt-0">
            {actions.map(renderButton)}
          </div>
        )}
      </div>
    </div>
  );
}